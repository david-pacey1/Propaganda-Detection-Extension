import { useState } from 'react';
import { Bookmark, Search, Trash2, Loader2, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router';
import type { RecordModel } from 'pocketbase';
import { useAuth } from '@/hooks/use-auth';
import { usePocketbaseRecords } from '@/hooks/use-pocketbase-records';
import { useListFilter } from '@/hooks/use-list-filter';
import { PostCard } from '@/components/post-card';
import { ContextPanel } from '@/components/home/context-panel';
import { AuthDialog } from '@/components/auth-dialog';
import type { SocialPost } from '@/lib/analysis';

type SavedRecord = RecordModel & { payload: SocialPost };
export function SavedWorkspace() {
  const auth = useAuth();
  const saved = usePocketbaseRecords<SavedRecord>('saved_analyses', { sort: '-created', enabled: auth.isAuthed });
  const filter = useListFilter({ items: saved.records, searchText: item => `${item.payload.author} ${item.payload.text}` });
  const [selected, setSelected] = useState<SocialPost | null>(null);
  const [active, setActive] = useState(0);
  const [notice, setNotice] = useState('');
  const [deleting, setDeleting] = useState('');
  const remove = async (id: string) => { setDeleting(id); try { await saved.remove(id); setSelected(null); setNotice('Saved analysis removed.'); } catch { setNotice('We couldn’t remove the analysis. Try again.'); } finally { setDeleting(''); } };
  return <main className="page-content secondary-page"><div className="page-title"><span className="eyebrow">KEEP THE USEFUL PERSPECTIVES</span><h1>Clarity, <span>worth keeping.</span></h1><p>Your saved posts and their context, in one personal space.</p></div>
    {auth.isLoading || (auth.isAuthed && saved.isLoading) ? <div className="empty-state"><Loader2 size={25} className="spin" /><p>Loading saved perspectives…</p></div> : !auth.isAuthed ? <div className="empty-state large-empty"><Bookmark size={32} /><h2>Your personal context library.</h2><p>Sign in to save useful analyses and come back to them later.</p><AuthDialog><button className="primary-button">Sign in to your workspace<ArrowUpRight size={16} /></button></AuthDialog></div> : saved.error ? <div className="empty-state"><h2>We couldn’t load your library.</h2><p>Please check your connection and try again.</p><button className="secondary-button" onClick={() => void saved.reload()}>Try again</button></div> : <><label className="search-input library-search"><Search size={17} /><input aria-label="Search saved analyses" placeholder="Search your saved perspectives…" value={filter.query} onChange={e => filter.setQuery(e.target.value)} /></label>{notice && <p className="notice" role="status">{notice}</p>}{!filter.results.length ? <div className="empty-state large-empty"><Bookmark size={32} /><h2>{filter.query ? 'No matching perspectives.' : 'A fresh page, for now.'}</h2><p>{filter.query ? 'Try a different search.' : 'Save a post’s analysis from Analyze a post to build your library.'}</p><Link className="primary-button" to="/">Analyze a post<ArrowUpRight size={17} /></Link></div> : <div className="feed-grid"><div className="post-list">{filter.results.map(item => <div key={item.id}><PostCard post={item.payload} selected={selected?.id === item.payload.id} activeFinding={active} onSelect={index => { setSelected(item.payload); setActive(index); }} saved /><button className="remove-saved" disabled={deleting === item.id} onClick={() => void remove(item.id)}>{deleting === item.id ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}Remove from saved</button></div>)}</div>{selected && <ContextPanel key={selected.id} post={selected} active={active} onActive={setActive} onSave={() => setNotice('Already saved in your library.')} onDismiss={() => setSelected(null)} />}</div>}</>}
  </main>;
}
