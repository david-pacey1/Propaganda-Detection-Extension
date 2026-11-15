import type { Route } from './+types/learn';
import { seo } from '@/lib/seo';
import { LearningLibrary } from '@/components/learn/learning-library';
import { solarImage } from '@/data/sample-posts';
export function meta({ matches, location }: Route.MetaArgs) { return seo({ matches, location }, { title: 'Your critical toolkit — Proper Gander', description: 'Understand manipulation techniques, logical fallacies and account signals. Learn to ask better questions about what you read on social media.', image: solarImage, jsonLd: { '@context': 'https://schema.org', '@type': 'LearningResource', name: 'Proper Gander critical toolkit', learningResourceType: 'Media literacy guide', educationalLevel: 'General audience' } }); }
export default function LearnPage() { return <LearningLibrary />; }
