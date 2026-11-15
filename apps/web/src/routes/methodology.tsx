import type { Route } from './+types/methodology';
import { seo } from '@/lib/seo';
import { MethodologyWorkspace } from '@/components/methodology/methodology-workspace';
import { solarImage } from '@/data/sample-posts';

export function meta({ matches, location }: Route.MetaArgs) {
	return seo({ matches, location }, {
		title: 'How well it works — Proper Gander',
		description: 'A transparent, measurable look at Proper Gander’s detection: precision, recall and false-positive rate on a labelled evaluation set, the methodology behind them, and where the system still fails.',
		image: solarImage,
		jsonLd: {
			'@context': 'https://schema.org',
			'@type': 'Dataset',
			name: 'Proper Gander illustrative detection evaluation set',
			description: 'A hand-labelled sample set used to compute precision, recall and false-positive rate for the Proper Gander detection layer.',
			creator: { '@type': 'Organization', name: 'Proper Gander' },
		},
	});
}

export default function MethodologyPage() {
	return <MethodologyWorkspace />;
}
