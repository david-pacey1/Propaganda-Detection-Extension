import type { Route } from './+types/settings';
import { seo } from '@/lib/seo';
import { PreferencesWorkspace } from '@/components/settings/preferences-workspace';
import { solarImage } from '@/data/sample-posts';
export function meta({ matches, location }: Route.MetaArgs) { return seo({ matches, location }, { title: 'Preferences & privacy — Proper Gander', description: 'Control your reading experience, manage your account and learn exactly how Proper Gander handles your data and AI-assisted social post analysis.', image: solarImage }); }
export default function SettingsPage() { return <PreferencesWorkspace />; }
