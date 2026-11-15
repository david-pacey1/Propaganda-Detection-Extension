import { useLocation } from 'react-router';
import { CircleHelp, ChevronRight, ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { useDisclosure } from '@/hooks/use-disclosure';

const pageNames: Record<string, string> = { '/': 'Analyze a post', '/saved': 'Saved analyses', '/learn': 'Learn & explore', '/methodology': 'How well it works', '/settings': 'Preferences' };
export function SiteHeader() {
  const { pathname } = useLocation();
  const help = useDisclosure();
  return <header className="site-header">
    <div className="breadcrumbs"><span>Workspace</span><ChevronRight size={14} /><strong>{pageNames[pathname] || 'Proper Gander'}</strong></div>
    <div className="header-actions"><span className="private-label"><ShieldCheck size={14} />Private by design</span><Dialog open={help.isOpen} onOpenChange={value => value ? help.open() : help.close()}><DialogTrigger asChild><button className="text-button"><CircleHelp size={17} />How it works</button></DialogTrigger><DialogContent className="clear-dialog"><DialogTitle className="dialog-heading">More context. Less noise.</DialogTitle><DialogDescription>Proper Gander is a companion workspace, not a replacement for your social feed.</DialogDescription><ol className="help-steps"><li><strong>Bring a post.</strong><p>Import a public Bluesky link, or paste content from another platform.</p></li><li><strong>Look for signals.</strong><p>AI identifies possible rhetorical techniques and claims that deserve a closer look.</p></li><li><strong>Keep your perspective.</strong><p>Read concise explanations beside the post, open references and make your own judgment.</p></li></ol><p className="notice">AI can be wrong. Suggested references are not live verification. A flagged phrase does not establish an author’s intent.</p></DialogContent></Dialog></div>
  </header>;
}
