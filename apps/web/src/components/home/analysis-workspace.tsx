import { useEffect, useState } from 'react';
import { Link, useFetcher } from 'react-router';
import {
	ScanLine, Link2, AlignLeft, ArrowRight, Loader2, TriangleAlert, Lightbulb,
	CheckCheck, ChevronRight, ArrowUpRight, Bookmark, Info, ShieldCheck, X, CircleCheck, Presentation,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { usePocketbaseRecords } from '@/hooks/use-pocketbase-records';
import { AuthDialog } from '@/components/auth-dialog';
import { sendMessage } from '@/api/integrated-ai-api';
import { parseAnalysis, safeSource } from '@/lib/analysis';
import type { Analysis, Finding, SocialPost } from '@/lib/analysis';

type Imported = { text?: string; author?: string; handle?: string; url?: string; platform?: string; error?: string; message?: string };

const PLATFORMS = ['X', 'Bluesky', 'Facebook', 'Instagram', 'LinkedIn', 'Reddit', 'Other'];

const findingIcon = (kind: Finding['kind']) =>
	kind === 'warning' ? <TriangleAlert size={16} /> : kind === 'technique' ? <Lightbulb size={16} /> : <CheckCheck size={16} />;
const findingKindLabel = (kind: Finding['kind']) =>
	kind === 'warning' ? 'PERSUASION SIGNAL' : kind === 'technique' ? 'MANIPULATION TECHNIQUE' : 'FACT-CHECKING CONTEXT';

export function AnalysisWorkspace() {
	const [mode, setMode] = useState<'text' | 'link'>('text');
	const [text, setText] = useState('');
	const [platform, setPlatform] = useState('X');
	const [link, setLink] = useState('');
	const [analysis, setAnalysis] = useState<Analysis | null>(null);
	const [analyzedText, setAnalyzedText] = useState('');
	const [rawResult, setRawResult] = useState('');
	const [stream, setStream] = useState('');
	const [busy, setBusy] = useState(false);
	const [openFinding, setOpenFinding] = useState<number | null>(null);
	const [notice, setNotice] = useState('');
	const [authOpen, setAuthOpen] = useState(false);
	const [savedIds, setSavedIds] = useState<string[]>([]);
	const auth = useAuth();
	const saved = usePocketbaseRecords('saved_analyses', { enabled: auth.isAuthed });
	const importFetcher = useFetcher<Imported>();

	const runAnalysis = async () => {
		if (!auth.isAuthed) { setAuthOpen(true); return; }
		if (text.trim().length < 15) { setNotice('Add at least 15 characters so there’s enough context to analyze.'); return; }
		setBusy(true); setStream(''); setRawResult(''); setAnalysis(null); setNotice(''); setOpenFinding(null);
		try {
			const response = await sendMessage({
				text: `Analyse this post independently. Platform: ${platform}. Original URL (not retrieved evidence): ${link || 'none'}. POST TEXT:\n${text.trim()}`,
				onText: chunk => setStream(previous => previous + chunk),
			});
			const parsed = parseAnalysis(response.content);
			if (!parsed) { setRawResult(response.content); setNotice('The analysis arrived in an unexpected format. Read the response below, or try again.'); }
			else { setAnalysis(parsed); setAnalyzedText(text.trim()); }
		} catch (error) {
			setNotice(error instanceof Error ? error.message : 'The analysis could not be completed. Please try again.');
		} finally { setBusy(false); }
	};

	const save = async () => {
		if (!auth.isAuthed) { setAuthOpen(true); return; }
		const post: SocialPost = {
			id: `analysis-${crypto.randomUUID()}`,
			text: analyzedText,
			platform,
			author: 'Imported post',
			handle: 'Pasted content',
			initials: 'P',
			url: link || undefined,
			time: 'Just analyzed',
			analysis: analysis ?? undefined,
		};
		if (savedIds.includes(post.id) || saved.records.some(record => (record.payload as SocialPost | undefined)?.text === post.text)) {
			setNotice('This perspective is already in your saved analyses.'); return;
		}
		try {
			await saved.create({ owner: auth.user!.id, payload: post });
			setSavedIds(current => [...current, post.id]);
			setNotice('Perspective saved. Find it in Saved analyses.');
		} catch { setNotice('We couldn’t save this analysis. Please try again.'); }
	};

	const importLink = (event: React.FormEvent) => {
		event.preventDefault();
		setNotice('');
		importFetcher.submit({ url: link }, { method: 'post', action: '/api/social-import', encType: 'application/json' });
	};

	// Fold the imported post into the textarea.
	useEffect(() => {
		const data = importFetcher.data;
		if (data?.text) {
			setText(data.text);
			if (data.platform) setPlatform(data.platform);
			setMode('text');
			setNotice('Post imported. Review it, then analyze.');
		} else if (data?.error || data?.message) {
			setNotice(data.error || data.message || 'Import failed.');
		}
	}, [importFetcher.data]);

	const findings = analysis?.findings || [];

	return <main className="page-content share-page">
		<section className="share-hero">
			<span className="eyebrow"><span className="tiny-dot" />A CLEARER PERSPECTIVE</span>
			<h1>Give a post<br /><span>a second look.</span></h1>
			<p>Paste a social post or text excerpt. Proper Gander adds concise context — claims, manipulation techniques and suggested references — beside the original, never over it.</p>
			<div className="share-hero-actions">
				<button className="primary-button" onClick={() => document.getElementById('analyze-input')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}><ScanLine size={17} />Analyze a post<ArrowRight size={16} /></button>
				<Link className="secondary-button" to="/learn">Build your toolkit<ArrowUpRight size={15} /></Link>
			</div>
		</section>

		<div id="analyze-input" className="share-input-card">
			<div className="segmented-control">
				<button className={mode === 'text' ? 'selected' : ''} onClick={() => { setMode('text'); setNotice(''); }}><AlignLeft size={16} />Paste text</button>
				<button className={mode === 'link' ? 'selected' : ''} onClick={() => { setMode('link'); setNotice(''); }}><Link2 size={16} />Import a link</button>
			</div>

			{mode === 'text' ? (
				<div className="stack-form">
					<label>Source platform
						<select value={platform} onChange={event => setPlatform(event.target.value)}>
							{PLATFORMS.map(p => <option key={p}>{p}</option>)}
						</select>
					</label>
					<label>Post or text excerpt
						<textarea required value={text} onChange={event => setText(event.target.value)} minLength={15} maxLength={15000} rows={7} placeholder="Paste the full post, including context that might change its meaning…" />
					</label>
					<div className="share-input-meta">
						<span className="fine-print">{text.length} / 15,000 characters · Text is sent to AI when you analyze it.</span>
					</div>
					<button className="primary-button full-width" onClick={() => void runAnalysis()} disabled={busy}>
						{busy ? <Loader2 size={17} className="spin" /> : <ScanLine size={17} />}Analyze this post<ArrowRight size={16} />
					</button>
				</div>
			) : (
				<div className="stack-form">
					<form onSubmit={importLink}>
						<label>Public Bluesky post link
							<input value={link} onChange={event => setLink(event.target.value)} required type="url" placeholder="https://bsky.app/profile/…/post/…" />
						</label>
						<button className="secondary-button full-width" disabled={importFetcher.state !== 'idle'}>
							{importFetcher.state !== 'idle' ? <Loader2 size={17} className="spin" /> : <Link2 size={17} />}Import post
						</button>
					</form>
					<p className="notice">Public Bluesky posts import directly. For X, Facebook, Instagram, LinkedIn and Reddit, copy the post text and use <strong>Paste text</strong>.</p>
				</div>
			)}
		</div>

		{notice && <div className="workspace-notice" role="status"><span>{notice}{notice.toLowerCase().includes('verify') && <Link className="verification-link" to="/settings">Manage email verification ↗</Link>}</span><button onClick={() => setNotice('')} className="icon-button" aria-label="Dismiss notification"><X size={15} /></button></div>}

		{busy && <div className="analysis-progress" role="status"><Loader2 size={20} className="spin" /><div><strong>Looking beyond the headline…</strong><p>{stream ? 'Building concise context from the post. The original stays untouched.' : 'Checking rhetorical signals and separating claims from opinions.'}</p></div></div>}

		{analysis && (
			<section className="share-results" aria-live="polite">
				<div className="results-heading">
					<span><ScanLine size={18} /> <strong>The context layer</strong></span>
					<button className="panel-save" onClick={() => void save()} disabled={busy}><Bookmark size={15} />Save<ArrowUpRight size={14} /></button>
				</div>
				{analysis.summary && <p className="results-summary">{analysis.summary}</p>}
				{!findings.length && <p className="empty-inline">No specific findings. This does not guarantee the content is accurate.</p>}
				<div className="finding-list">
					{findings.map((finding, index) => (
						<div key={index} className={`finding-item finding-${finding.kind} ${openFinding === index ? 'finding-selected' : ''}`}>
							<button className="finding-row" onClick={() => setOpenFinding(openFinding === index ? null : index)} aria-expanded={openFinding === index}>
								<span className="finding-icon">{findingIcon(finding.kind)}</span>
								<span><small>{findingKindLabel(finding.kind)}</small><strong>{finding.title}</strong></span>
								<ChevronRight size={15} className={`finding-chevron ${openFinding === index ? 'open' : ''}`} />
							</button>
							{openFinding === index && (
								<div className="finding-detail" aria-live="polite">
									<span className={`verdict-label verdict-${finding.kind}`}>{finding.verdict}</span>
									{finding.quote && <p className="finding-quote">“{finding.quote}”</p>}
									<p>{finding.explanation}</p>
									{finding.sources.filter(s => safeSource(s.url)).map(s => (
										<a key={s.url} className="source-link" href={s.url} target="_blank" rel="noreferrer">{s.title}<ArrowUpRight size={15} /></a>
									))}
								</div>
							)}
						</div>
					))}
				</div>
				<div className="context-disclaimer"><Info size={14} /><p>Signals aren’t conclusions. AI can make mistakes; always check original evidence.</p></div>
			</section>
		)}

		{rawResult && <section className="raw-result"><h3>AI response</h3><p>{rawResult}</p></section>}

		{!analysis && !busy && !rawResult && (
			<section className="share-empty">
				<CircleCheck size={22} />
				<div><strong>Nothing analyzed yet</strong><p>Paste a post or text excerpt above. Your content stays visible — Proper Gander just adds context beside it.</p></div>
			</section>
		)}

		<section className="share-install">
			<span className="eyebrow"><ShieldCheck size={13} />HOW IT WORKS</span>
			<h2>Context, not conclusions.</h2>
			<p>Bring in any post or text excerpt. AI identifies rhetorical signals, manipulation techniques and claims worth checking, with suggested references — so you can ask better questions and decide for yourself.</p>
			<div className="share-install-note"><ShieldCheck size={16} />No social accounts are connected. Proper Gander never posts or changes your feeds.</div>
			<Link className="text-button" to="/learn">Explore the critical toolkit<ArrowUpRight size={14} /></Link>
			<Link className="text-button" to="/methodology">See how well detection actually performs<ArrowUpRight size={14} /></Link>
			<a className="text-button" href="/api/presentation/download" download><Presentation size={14} />Download the project deck<ArrowUpRight size={14} /></a>
		</section>

		<AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
	</main>;
}
