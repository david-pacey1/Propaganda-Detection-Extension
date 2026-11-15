import { useState } from 'react';
import { MessageCircle, Repeat2, Heart, Bookmark, MoreHorizontal, ExternalLink, ScanLine, Loader2, EyeOff, Flag, Check, CircleCheck, TriangleAlert, Lightbulb, X } from 'lucide-react';
import { useDisclosure } from '@/hooks/use-disclosure';
import { solarImage } from '@/data/sample-posts';
import { safeSource } from '@/lib/analysis';
import type { Finding, SocialPost } from '@/lib/analysis';

export function PostCard({ post, selected, activeFinding, highlights = true, onSelect, onAnalyze, onSave, saved = false, busy = false }: { post: SocialPost; selected?: boolean; activeFinding?: number; highlights?: boolean; onSelect: (index: number) => void; onAnalyze?: () => void; onSave?: () => void; saved?: boolean; busy?: boolean }) {
  const menu = useDisclosure();
  const [hidden, setHidden] = useState(false);
  const [liked, setLiked] = useState(false);
  const [note, setNote] = useState('');
  const [compactOpen, setCompactOpen] = useState(true);
  const findings = post.analysis?.findings ?? [];
  const quoted = findings.filter(f => f.quote && post.text.includes(f.quote));
  const segments: { text: string; finding?: Finding }[] = [];
  let cursor = 0;
  while (cursor < post.text.length) {
    let match: Finding | undefined;
    let at = post.text.length;
    for (const f of quoted) { const index = post.text.indexOf(f.quote, cursor); if (index >= cursor && index < at) { at = index; match = f; } }
    if (!match) { segments.push({ text: post.text.slice(cursor) }); break; }
    if (at > cursor) segments.push({ text: post.text.slice(cursor, at) });
    segments.push({ text: match.quote, finding: match }); cursor = at + match.quote.length;
  }
  const warningCount = findings.filter(f => f.kind !== 'fact').length;
  const compactFinding = findings[activeFinding ?? 0];
  const choose = (index: number) => { setCompactOpen(true); onSelect(index); };
  return <article className={`post-card ${selected ? 'post-selected' : ''}`} aria-label={`Post by ${post.author}`}>
    <div className="post-author-row"><span className={`post-avatar ${post.platform === 'Bluesky' ? 'avatar-sage' : ''}`}>{post.initials}</span><div className="post-author"><strong>{post.author}</strong><span>{post.handle}<span className="middle-dot">·</span>{post.time}</span></div><span className="platform-symbol" title={post.platform}>{post.platform === 'Bluesky' ? 'b' : post.platform === 'X' ? '𝕏' : post.platform.slice(0, 1)}</span><div className="post-menu"><button className="icon-button" aria-label="Post options" {...menu.triggerProps}><MoreHorizontal size={20} /></button>{menu.isOpen && <div className="mini-menu" {...menu.panelProps}><button onClick={() => { setHidden(!hidden); menu.close(); }}><EyeOff size={15} />{hidden ? 'Show' : 'Hide'} context</button>{post.url && <a href={post.url} target="_blank" rel="noreferrer"><ExternalLink size={15} />Open original</a>}<button onClick={() => { setNote('Treat this analysis as a starting point. Compare the exact claim with the original source and independent reporting.'); menu.close(); }}><Flag size={15} />Question this analysis</button></div>}</div></div>
    <p className="post-text">{segments.map((segment, index) => segment.finding && highlights && !hidden ? <button key={index} className={`inline-highlight highlight-${segment.finding.kind} ${selected && findings.indexOf(segment.finding) === activeFinding ? 'highlight-active' : ''}`} onClick={() => choose(findings.indexOf(segment.finding!))}>{segment.text}</button> : <span key={index}>{segment.text}</span>)}</p>
    {selected && compactOpen && compactFinding && !hidden && <section className={`compact-context compact-${compactFinding.kind}`} aria-label="Context for this post"><div><span>{compactFinding.kind === 'warning' ? <TriangleAlert size={15} /> : compactFinding.kind === 'technique' ? <Lightbulb size={15} /> : <CircleCheck size={15} />}</span><strong>{compactFinding.title}</strong><button className="icon-button" aria-label="Dismiss compact context" onClick={() => setCompactOpen(false)}><X size={15} /></button></div><span className="verdict-label">{compactFinding.verdict}</span><p>{compactFinding.explanation}</p>{compactFinding.sources.filter(s => safeSource(s.url)).map(source => <a href={source.url} key={source.url} target="_blank" rel="noreferrer">{source.title}<ExternalLink size={12} /></a>)}<small>{post.demo ? 'Educational example · Check the original reference.' : 'AI-assisted context · Not live-verified.'}</small></section>}
    {post.image && <img className="post-image" src={post.image} alt="Solar panels on rooftops surrounded by trees" loading="lazy" {...(post.image === solarImage ? { srcSet: `${solarImage}?width=375 375w, ${solarImage}?width=768 768w, ${solarImage}?width=1024 1024w, ${solarImage} 1344w`, sizes: '(min-width: 1200px) 560px, (min-width: 900px) 50vw, 90vw' } : {})} />}
    <div className="social-actions"><button aria-label="About comments" onClick={() => setNote('Comments remain on the original platform. Proper Gander never posts on your behalf.')}><MessageCircle size={17} /><span>Discuss</span></button><button aria-label="About reposting" onClick={() => setNote('Open the original post to repost. Consider checking the context before sharing.')}><Repeat2 size={18} /><span>Repost</span></button><button aria-label={liked ? 'Remove local like' : 'Like this example locally'} aria-pressed={liked} className={liked ? 'liked' : ''} onClick={() => setLiked(!liked)}><Heart size={17} fill={liked ? 'currentColor' : 'none'} /><span>{liked ? 'Liked locally' : 'Like'}</span></button><button aria-label={saved ? 'Analysis saved' : 'Save analysis'} onClick={onSave} disabled={!post.analysis || !onSave}><Bookmark size={17} fill={saved ? 'currentColor' : 'none'} /></button></div>
    {note && <div className="post-note"><p>{note}</p><button onClick={() => setNote('')} aria-label="Dismiss message">Dismiss</button></div>}
    {!hidden && <div className={`signal-strip ${warningCount ? 'strip-warning' : 'strip-clear'}`}><span>{warningCount ? <TriangleAlert size={16} /> : post.analysis ? <CircleCheck size={16} /> : <ScanLine size={16} />}<strong>{post.analysis ? warningCount ? 'Worth a closer look' : 'No manipulation flagged' : 'Ready for a second look'}</strong></span>{post.analysis ? <button onClick={() => choose(0)}>{warningCount ? `${findings.length} context notes` : 'See context'}<span>↗</span></button> : <button disabled={busy} onClick={onAnalyze}>{busy ? <Loader2 size={14} className="spin" /> : <Lightbulb size={14} />}{busy ? 'Analyzing…' : 'Analyze post'}</button>}</div>}
    {hidden && <div className="hidden-context"><Check size={14} />Context hidden<button onClick={() => setHidden(false)}>Show again</button></div>}
    {post.demo && <span className="example-caption">Fictional educational example · Not a live social feed</span>}
  </article>;
}
