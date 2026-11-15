import { apiError, readFormData, readJsonBody, withApi } from '@/lib/api.server';
import { factCheckPost } from '@/lib/extension-factcheck.server';

/**
 * POST /api/extension/analyze — called by the Proper Gander browser extension to
 * fact-check a social post with the AI agent. Authenticates via a link token
 * (in the body, query string, or Authorization header) generated in Settings;
 * the token resolves to a verified user whose AI message budget the check is
 * charged against.
 *
 * The extension sends a form-urlencoded body (a CORS-safelisted, proxy-safe
 * content type), but JSON bodies and query params are also accepted so older
 * extension builds and direct tests keep working.
 */
export const action = withApi(async ({ request }) => {
	if (request.method !== 'POST') {
		return apiError(405, 'Method not allowed');
	}

	const url = new URL(request.url);
	const contentType = request.headers.get('content-type') ?? '';

	let text: unknown;
	let bodyToken: unknown;
	let postUrl: unknown;
	let platform: unknown;
	let images: unknown;

	if (contentType.includes('application/json')) {
		const body = await readJsonBody<Record<string, unknown>>(request);
		text = body.text;
		bodyToken = body.token;
		postUrl = body.url;
		platform = body.platform;
		images = body.images;
	} else {
		// form-urlencoded (current extension), multipart, or text/plain fallback.
		// readFormData parses application/x-www-form-form-urlencoded into a
		// FormData object; query params cover the case where a proxy strips the
		// body entirely.
		let formData: FormData;
		try {
			formData = await readFormData(request);
		} catch {
			formData = new FormData();
		}
		const get = (name: string): unknown =>
			(formData.get(name) as string) || url.searchParams.get(name) || undefined;
		text = get('text');
		bodyToken = get('token');
		postUrl = get('url');
		platform = get('platform');
		// Images arrive as a JSON-encoded array of image URLs (the extension
		// collects <img> src values from the post).
		const rawImages = get('images');
		if (typeof rawImages === 'string' && rawImages.trim()) {
			try {
				images = JSON.parse(rawImages);
			} catch {
				images = undefined;
			}
		}
	}

	if ((typeof text !== 'string' || text.trim().length < 12) && (!Array.isArray(images) || images.length === 0)) {
		return apiError(422, 'Post text or an image is required.');
	}

	if (typeof text === 'string' && text.length > 8000) {
		return apiError(422, 'Post text is too long to fact-check.');
	}

	const finalUrl = typeof postUrl === 'string' && postUrl.length < 2048 ? postUrl : undefined;
	const finalPlatform = typeof platform === 'string' && platform.length < 40 ? platform : undefined;
	const finalImages = Array.isArray(images)
		? images.filter((src): src is string => typeof src === 'string' && src.length < 2048)
		: undefined;

	// The extension sends its link token in the body/query so the request can be
	// a "simple" CORS request (form-urlencoded, no Authorization header) and
	// avoid a preflight. Fall back to the Authorization header for older builds.
	const header = request.headers.get('authorization') ?? '';
	const headerToken = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';
	const token = (typeof bodyToken === 'string' ? bodyToken.trim() : '') || headerToken;

	const analysis = await factCheckPost({ request, text: typeof text === 'string' ? text : '', url: finalUrl, platform: finalPlatform, token, images: finalImages });

	// The browser extension calls this from a different origin (the social site
	// the user is browsing). `withApi` stamps every response with
	// `Cross-Origin-Resource-Policy: same-origin`, which would block the
	// extension from reading the response, so override it here. The endpoint is
	// token-authenticated, so opening it cross-origin is safe. These headers are
	// set on the response directly; `withApi` only fills headers that are absent,
	// so they are preserved.
	return new Response(JSON.stringify(analysis), {
		status: 200,
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Cross-Origin-Resource-Policy': 'cross-origin',
		},
	});
});
