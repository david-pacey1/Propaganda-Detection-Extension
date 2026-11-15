import type { Route } from './+types/saved';
import { seo } from '@/lib/seo';
import { SavedWorkspace } from '@/components/saved/saved-workspace';
import { solarImage } from '@/data/sample-posts';
export function meta({ matches, location }: Route.MetaArgs) { return seo({ matches, location }, { title: 'Saved analyses — Proper Gander', description: 'Your personal library of social posts and useful context. Save a perspective and return to its claims, sources and explanations whenever you need.', image: solarImage, noindex: true }); }
export default function SavedPage() { return <SavedWorkspace />; }
