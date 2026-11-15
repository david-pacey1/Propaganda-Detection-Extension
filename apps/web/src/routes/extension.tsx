import type { Route } from './+types/extension';
import { seo } from '@/lib/seo';
import { ExtensionGuide } from '@/components/extension/extension-guide';
import { solarImage } from '@/data/sample-posts';
export function meta({ matches, location }: Route.MetaArgs) {
	return seo({ matches, location }, {
		title: 'In-place browser extension — Proper Gander',
		description: 'A lightweight browser extension adds discreet, dismissible context overlays alongside posts on X, Bluesky, Facebook, Instagram, LinkedIn and Reddit. An AI agent detects manipulation techniques and verifies claims against the web.',
		image: solarImage,
		jsonLd: { '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Proper Gander browser extension', applicationCategory: 'BrowserExtension', operatingSystem: 'Chrome, Edge, Brave', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } },
	});
}
export default function ExtensionPage() { return <ExtensionGuide />; }
