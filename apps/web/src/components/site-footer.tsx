import { Link } from 'react-router';
import { ScanLine } from 'lucide-react';
export function SiteFooter() {
  return <footer className="site-footer"><span><ScanLine size={14} />Proper Gander © 2026</span><span>Context, not conclusions.</span><Link to="/settings">Privacy & preferences</Link></footer>;
}
