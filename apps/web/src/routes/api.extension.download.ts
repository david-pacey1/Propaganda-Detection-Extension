import { promises as fs, existsSync } from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import type { Route } from './+types/api.extension.download';
import { siteOrigin } from '@/lib/site-origin.server';
import logger from '@/lib/logger.server';

/**
 * GET /api/extension/download — bundles the browser extension source files into
 * a .zip the visitor can download and load unpacked, with this site's origin
 * pre-filled as the default web app URL (so the user only has to paste their
 * link token).
 *
 * The extension source lives in apps/browser-extension/ at the repo root. The
 * web process runs from apps/web, so the folder is one level up. The site
 * origin is injected into background.js's onInstalled default so a fresh
 * install seeds `cfAppUrl` automatically.
 */

const EXTENSION_FILES = [
	'manifest.json',
	'background.js',
	'content.js',
	'popup.html',
	'popup.css',
	'popup.js',
];

// Binary assets (the extension icon) must be read as buffers, not utf8 text,
// so they survive the zip intact and the icon renders in the browser toolbar.
const BINARY_FILES = ['icon.png'];

// The web process runs from apps/web, so the extension folder is one level up.
// Try a couple of candidates so the download works in dev and production.
function resolveExtensionDir(): string | null {
	const candidates = [
		path.resolve(process.cwd(), '..', 'browser-extension'),
		path.resolve(process.cwd(), 'browser-extension'),
		path.resolve(process.cwd(), '..', '..', 'apps', 'browser-extension'),
	];
	for (const candidate of candidates) {
		try {
			if (existsSync(candidate)) return candidate;
		} catch {
			// ignore and try the next candidate
		}
	}
	return null;
}

export async function loader({ request }: Route.LoaderArgs) {
	const origin = siteOrigin(request);

	let zipBuffer: Uint8Array;

	try {
		const extensionDir = resolveExtensionDir();
		if (!extensionDir) {
			throw new Error('browser-extension folder not found');
		}
		const zip = new JSZip();

		for (const name of EXTENSION_FILES) {
			const filePath = path.join(extensionDir, name);
			let content = await fs.readFile(filePath, 'utf8');

			// Inject this site's origin as the default web app URL so the
			// extension is pre-linked on install. The placeholder is the
			// DEFAULT_APP_URL constant in background.js.
			if (name === 'background.js') {
				content = content.replace(
					/const DEFAULT_APP_URL = '';/,
					`const DEFAULT_APP_URL = ${JSON.stringify(origin)};`,
				);
			}

			zip.file(name, content);
		}

		// Add binary assets (the extension icon) as buffers so the PNG is not
		// corrupted by utf8 decoding.
		for (const name of BINARY_FILES) {
			const filePath = path.join(extensionDir, name);
			const buffer = await fs.readFile(filePath);
			zip.file(name, buffer);
		}

		zipBuffer = await zip.generateAsync({
			type: 'uint8array',
			compression: 'DEFLATE',
			compressionOptions: { level: 9 },
		});
	} catch (error) {
		logger.error(`extension download failed: ${error instanceof Error ? error.message : String(error)}`);

		return new Response('Extension files are not available right now. Try again later.', {
			status: 503,
			headers: { 'Content-Type': 'text/plain' },
		});
	}

	return new Response(new Blob([new Uint8Array(zipBuffer)], { type: 'application/zip' }), {
		status: 200,
		headers: {
			'Content-Type': 'application/zip',
			'Content-Disposition': 'attachment; filename="proper-gander-extension.zip"',
			'Cache-Control': 'no-store',
		},
	});
}
