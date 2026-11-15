import type { Route } from './+types/api.presentation.download';
import { siteOrigin } from '@/lib/site-origin.server';
import { buildPresentation } from '@/lib/presentation.server';
import logger from '@/lib/logger.server';

/**
 * GET /api/presentation/download — generates and returns a branded PowerPoint
 * (.pptx) slide deck showcasing the Proper Gander project. The deck is built
 * on demand from the project's real content (no invented capabilities or
 * results) using JSZip to assemble the OOXML package.
 */
export async function loader({ request }: Route.LoaderArgs) {
	const origin = siteOrigin(request);

	try {
		const pptx = await buildPresentation(origin);

		return new Response(new Blob([new Uint8Array(pptx)], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }), {
			status: 200,
			headers: {
				'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
				'Content-Disposition': 'attachment; filename="proper-gander-overview.pptx"',
				'Cache-Control': 'no-store',
			},
		});
	} catch (error) {
		logger.error(`presentation download failed: ${error instanceof Error ? error.message : String(error)}`);

		return new Response('The presentation could not be generated right now. Try again later.', {
			status: 503,
			headers: { 'Content-Type': 'text/plain' },
		});
	}
}
