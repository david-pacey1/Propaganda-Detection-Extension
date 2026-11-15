import { useState } from 'react';
import { ScanLine, X, TriangleAlert, Lightbulb, CheckCheck, ChevronRight, ArrowUpRight, Bookmark, Info, Eye } from 'lucide-react';
import { Link } from 'react-router';
import type { SocialPost } from '@/lib/analysis';
import { safeSource } from '@/lib/analysis';
export function ContextPanel({ post, active, onActive, onSave, onDismiss }: { post: SocialPost; active: number; onActive: (value: number) => void; onSave: () => void; onDismiss: () => void }) {
  const [tab, setTab] = useState('all');
  const findings = post.analysis?.findings || [];
  const finding = findings[active];
  const shown = findings.map((f, index) => ({ ...f, index })).filter(f => tab === 'all' || f.kind === tab);
  return <aside className="context-rail">
    <section className="context-panel bracket-frame"><div className="panel-heading"><span><ScanLine size={18} /><strong>The context layer</strong></span><button onClick={onDismiss} className="icon-button" aria-label="Dismiss context panel"><X size={16} /></button></div>
      <p className="panel-description">A little perspective on what you’re reading.</p>
      <div className="context-tabs" aria-label="Context types">{[{ id: 'all', label: 'All' }, { id: 'warning', label: 'Signals' }, { id: 'technique', label: 'Techniques' }, { id: 'fact', label: 'Facts' }].map(t => <button key={t.id} aria-pressed={tab === t.id} className={tab === t.id ? 'selected' : ''} onClick={() => { setTab(t.id); const first = findings.findIndex(f => t.id === 'all' || f.kind === t.id); if (first >= 0) onActive(first); }}>{t.label}</button>)}</div>
      {!findings.length && post.analysis?.summary && <p className="empty-inline">{post.analysis.summary}</p>}
      <div className="finding-list">{shown.map(f => <button key={f.index} onClick={() => onActive(f.index)} className={`finding-item finding-${f.kind} ${active === f.index ? 'finding-selected' : ''}`}><span className="finding-icon">{f.kind === 'warning' ? <TriangleAlert size={16} /> : f.kind === 'technique' ? <Lightbulb size={16} /> : <CheckCheck size={16} />}</span><span><small>{f.kind === 'warning' ? 'PERSUASION SIGNAL' : f.kind === 'technique' ? 'MANIPULATION TECHNIQUE' : 'FACT-CHECKING CONTEXT'}</small><strong>{f.title}</strong></span><ChevronRight size={15} /></button>)}{!shown.length && <p className="empty-inline">No notes in this category. This does not guarantee the content is accurate.</p>}</div>
      {finding && shown.some(f => f.index === active) && <div className="finding-detail" aria-live="polite"><span className={`verdict-label verdict-${finding.kind}`}>{finding.verdict}</span><p>{finding.explanation}</p>{finding.sources.filter(s => safeSource(s.url)).map(s => <a key={s.url} className="source-link" href={s.url} target="_blank" rel="noreferrer">{s.title}<ArrowUpRight size={15} /></a>)}{finding.kind === 'fact' && <span className="fine-print">{post.demo ? 'Reference-based educational example.' : 'Suggested references · Not a live-verified verdict.'}</span>}</div>}
      <button className="panel-save" onClick={onSave}><Bookmark size={15} />Save this perspective<ChevronRight size={15} /></button>
      <div className="context-disclaimer"><Info size={14} /><p>Signals aren’t conclusions. You’re always in control of what you read.</p></div>
    </section>
    <section className="learning-prompt"><span className="eyebrow">BUILD YOUR CRITICAL TOOLKIT</span><span className="learning-icon"><Lightbulb size={25} strokeWidth={1.5} /></span><h3>Spot the pattern.<br />Not just the post.</h3><p>Learn how persuasion works, one small insight at a time.</p><Link to="/learn">Explore the learning library<ArrowUpRight size={16} /></Link></section>
    <details className="actor-context"><summary><Eye size={15} />What about the account?<ChevronRight size={14} /></summary><p>{post.analysis?.actorContext || 'Account behaviour needs corroborating evidence over time. A single post is not enough.'}</p></details>
  </aside>;
}
