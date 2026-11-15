import type { Route } from './+types/home';
import { seo } from '@/lib/seo';
import { AnalysisWorkspace } from '@/components/home/analysis-workspace';
import { solarImage } from '@/data/sample-posts';
export function meta({ matches, location }: Route.MetaArgs) {
  return seo({ matches, location }, { title: 'Proper Gander — Give a post a second look.', description: 'Paste a social post or text excerpt and get concise context: claims, manipulation techniques and suggested references, beside the original content.', image: solarImage, jsonLd: [{ '@context': 'https://schema.org', '@type': 'WebSite', name: 'Proper Gander', description: 'A media literacy workspace for analyzing social posts and text excerpts.' }, { '@context': 'https://schema.org', '@type': 'Organization', name: 'Proper Gander', description: 'Helping people understand the context behind social content.' }] });
}
export default function HomePage() { return <AnalysisWorkspace />; }
