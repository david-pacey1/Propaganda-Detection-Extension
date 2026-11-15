/**
 * Server-side AI fact-checking for the Proper Gander browser extension.
 *
 * The extension runs on social sites and cannot share the web app's PocketBase
 * session, so it authenticates with a long-lived link token the user generates
 * in Settings and pastes into the extension popup. This module validates that
 * token, resolves the owning (verified) user, and runs one model turn with a
 * web-search-oriented fact-checking prompt — returning structured findings the
 * extension renders as sourced verdicts.
 *
 * Never imported from a component or clientLoader: it reads model credentials.
 */
import { FACTCHECK_SYSTEM_PROMPT } from '@/constants/ai-assistant.config';
import { apiError } from '@/lib/api.server';
import { consumeAssistantRateLimit } from '@/lib/integrated-ai.server';
import logger from '@/lib/logger.server';
import { pocketbaseAdmin } from '@/lib/pocketbase-client.server';
import { clientIdentifier } from '@/lib/rate-limit.server';
import { parseAnalysis, type Analysis } from '@/lib/analysis';

type ExtensionTokenRecord = { id: string; token: string; owner: string };
type UserRecord = { id: string; verified: boolean; email: string };

const requireEnv = (name: string): string => {
	const value = process.env[name];

	if (!value) {
		throw new Error(`${name} is not set — was Integrated AI enabled for this site?`);
	}

	return value;
};

/**
 * Resolves the user behind an extension link token, enforcing the same
 * verified-email gate as the in-app assistant. Throws 401 for a missing/unknown
 * token and 403 for an unverified account — both surface in the extension UI.
 *
 * The token is passed in (read from the request body by the route, with a
 * header fallback) rather than read from the Authorization header here, so the
 * extension can send a "simple" CORS request that avoids a preflight.
 */
export const resolveExtensionUser = async (token: string): Promise<string> => {
	if (!token || token.length < 16) {
		throw apiError(401, 'Link your extension from Proper Gander settings first.');
	}

	let records: ExtensionTokenRecord[];

	try {
		const result = await pocketbaseAdmin.listRecords<ExtensionTokenRecord>('extension_tokens', {
			perPage: 1,
			filter: pocketbaseAdmin.filter('token = {:token}', { token }),
		});
		records = result.items;
	} catch (error) {
		logger.error(`extension token lookup failed: ${error instanceof Error ? error.message : String(error)}`);

		throw apiError(500, 'Could not verify the extension link. Try again.');
	}

	if (!records.length) {
		throw apiError(401, 'Extension link token is invalid. Regenerate it in Proper Gander settings.');
	}

	const owner = records[0].owner;

	let user: UserRecord;

	try {
		user = await pocketbaseAdmin.getRecord<UserRecord>('users', owner);
	} catch (error) {
		logger.error(`extension user lookup failed: ${error instanceof Error ? error.message : String(error)}`);

		throw apiError(401, 'The account for this extension link no longer exists.');
	}

	if (!user.verified) {
		throw apiError(403, 'Verify your Proper Gander email to use AI fact-checking.');
	}

	return owner;
};

/** Reads the model's SSE stream to completion and returns the concatenated text. */
const readModelContent = async (stream: ReadableStream<Uint8Array>): Promise<string> => {
	const reader = stream.getReader();
	const decoder = new TextDecoder();
	let buffer = '';
	let content = '';

	for (;;) {
		const { done, value } = await reader.read();

		if (done) {
			return content;
		}

		buffer += decoder.decode(value, { stream: true });

		const frames = buffer.split('\n\n');
		buffer = frames.pop() ?? '';

		for (const frame of frames) {
			const payload = frame
				.split('\n')
				.filter(line => line.startsWith('data: '))
				.map(line => line.slice('data: '.length))
				.join('');

			if (!payload || payload === '[DONE]') {
				continue;
			}

			let event: { type: string; data: { content?: string } };

			try {
				event = JSON.parse(payload);
			} catch {
				continue;
			}

			if (event.type === 'error') {
				throw new Error(String(event.data?.content ?? 'Model request failed'));
			}

			if (event.type === 'content' && typeof event.data?.content === 'string') {
				content += event.data.content;
			}
		}
	}
};

/**
 * Runs one fact-checking turn against the Integrated AI model and returns the
 * parsed analysis. The turn is not stored (the extension is one-shot, not a
 * chat transcript) but is charged against the user's assistant message budget.
 */
export const factCheckPost = async ({
	request,
	text,
	url,
	platform,
	token,
	images,
}: {
	request: Request;
	text: string;
	url?: string;
	platform?: string;
	token: string;
	images?: string[];
}): Promise<Analysis> => {
	const userId = await resolveExtensionUser(token);

	if (!(await consumeAssistantRateLimit(userId ?? clientIdentifier(request)))) {
		throw apiError(429, 'Too many fact-check requests. Wait a minute and try again.');
	}

	// Cap the number of images sent to the model to keep the request bounded and
	// the fact-check fast — image analysis is the slowest part of the turn.
	const imageUrls = Array.isArray(images)
		? images.filter((src): src is string => typeof src === 'string' && /^https?:\/\//i.test(src)).slice(0, 2)
		: [];

	const userMessage = `Platform: ${platform || 'social media'}${url ? `\nPost URL: ${url}` : ''}\n\nPost text:\n${text}${imageUrls.length ? `\n\nThis post includes ${imageUrls.length === 1 ? '1 image' : `${imageUrls.length} images`} — analyse them for propaganda and manipulation.` : ''}`;

	const proxyEntranceId = process.env.PROXY_ENTRANCE_ID;

	const response = await fetch(`${requireEnv('INTEGRATED_AI_API_URL')}/generate`, {
		method: 'POST',
		headers: {
			Accept: 'text/event-stream',
			'Content-Type': 'application/json',
			Authorization: `Bearer ${requireEnv('INTEGRATED_AI_API_KEY')}`,
			...(proxyEntranceId && { 'X-Proxy-Entrance-Id': proxyEntranceId }),
		},
		body: JSON.stringify({
			website_id: process.env.WEBSITE_ID,
			history: [
				{
					role: 'user',
					content: userMessage,
					...(imageUrls.length > 0 && { images: imageUrls }),
				},
			],
			system_prompt: FACTCHECK_SYSTEM_PROMPT,
			stream: true,
			environment: process.env.NODE_ENV === 'production' ? 'prod' : 'dev',
		}),
		signal: AbortSignal.timeout(60_000),
	});

	if (!response.ok || !response.body) {
		const details = await response.text().catch(() => 'unknown error');

		throw new Error(`Model request failed with status ${response.status}: ${details}`);
	}

	const content = await readModelContent(response.body);
	const analysis = parseAnalysis(content);

	if (!analysis) {
		logger.error(`extension fact-check produced unparseable output: ${content.slice(0, 500)}`);

		throw apiError(502, 'The AI could not produce a structured analysis. Try again.');
	}

	return analysis;
};
