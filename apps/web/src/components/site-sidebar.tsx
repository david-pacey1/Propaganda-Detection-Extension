import { NavLink } from 'react-router';
import { PanelsTopLeft, Bookmark, BookOpen, Puzzle, Settings2, ArrowUpRight, LogOut, ShieldCheck, Gauge } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { AuthDialog } from '@/components/auth-dialog';

export function SiteSidebar() {
  const auth = useAuth();
  return <aside className="site-sidebar">
    <NavLink to="/" className="brand"><span className="brand-mark"><img src="/favicon.png" alt="Proper Gander" width={28} height={28} /></span>proper gander<span className="brand-dot">.</span></NavLink>
    <span className="sidebar-label">YOUR WORKSPACE</span>
    <nav aria-label="Main navigation">
      <NavLink to="/" end><PanelsTopLeft size={19} />Analyze a post<span className="nav-dot" /></NavLink>
      <NavLink to="/saved"><Bookmark size={19} />Saved analyses</NavLink>
      <NavLink to="/learn"><BookOpen size={19} />Learn & explore</NavLink>
      <NavLink to="/methodology"><Gauge size={19} />How well it works</NavLink>
      <NavLink to="/extension"><Puzzle size={19} />Browser extension</NavLink>
      <NavLink to="/settings"><Settings2 size={19} />Preferences</NavLink>
    </nav>
    <div className="sidebar-bottom">
      <div className="quiet-card"><ShieldCheck size={23} /><h3>A lens, not a filter.</h3><p>Your feed stays yours.<br />We just add a little context.</p><NavLink to="/learn">Meet your critical toolkit <ArrowUpRight size={15} /></NavLink></div>
      <div className="account-slot">{auth.isLoading ? <span className="fine-print">Loading workspace…</span> : auth.isAuthed ? <><span className="profile-avatar">{String(auth.user?.name || auth.user?.email || 'You').slice(0, 1).toUpperCase()}</span><span className="profile-copy"><strong>{auth.user?.name || 'Your account'}</strong><small>Personal workspace</small></span><button className="icon-button" aria-label="Sign out" onClick={auth.logout}><LogOut size={17} /></button></> : <AuthDialog><button className="account-signin"><span className="profile-avatar">Y</span><span><strong>Your personal workspace</strong><small>Sign in to get started</small></span><ArrowUpRight size={17} /></button></AuthDialog>}</div>
    </div>
  </aside>;
}
