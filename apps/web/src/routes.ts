import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
	index('routes/home.tsx'),
	route('saved', 'routes/saved.tsx'),
	route('learn', 'routes/learn.tsx'),
	route('methodology', 'routes/methodology.tsx'),
	route('extension', 'routes/extension.tsx'),
	route('settings', 'routes/settings.tsx'),
	route('sitemap.xml', 'routes/sitemap.xml.ts'),
	route('robots.txt', 'routes/robots.txt.ts'),
	route('api/health', 'routes/api.health.ts'),
	route('api/integrated-ai/stream', 'routes/api.integrated-ai.stream.ts'),
	route('api/social-import', 'routes/api.social-import.ts'),
	route('api/extension/analyze', 'routes/api.extension.analyze.ts'),
	route('api/extension/download', 'routes/api.extension.download.ts'),
	route('api/presentation/download', 'routes/api.presentation.download.ts'),
	route('api/*', 'routes/api.$.ts'),
] satisfies RouteConfig;
