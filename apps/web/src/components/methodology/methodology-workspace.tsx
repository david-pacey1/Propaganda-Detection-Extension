import { Link } from 'react-router';
import { ArrowUpRight, Info, FlaskConical, ExternalLink, ShieldCheck, Presentation } from 'lucide-react';
import { evaluationSet, evaluationMeta, type Outcome } from '@/data/evaluation';
import { evaluationBreakdown, evaluationStats, outcomeLabel, outcomeTallies, pct } from '@/lib/evaluation';

const outcomeShort: Record<Outcome, string> = {
	'true-positive': 'True positive',
	'true-negative': 'True negative',
	'false-positive': 'False positive',
	'false-negative': 'False negative',
};

const kindTone: Record<string, string> = {
	warning: 'verdict-warning',
	technique: '',
	fact: 'verdict-fact',
};

export function MethodologyWorkspace() {
	return (
		<main className="page-content secondary-page methodology-page">
			<div className="page-title">
				<span className="eyebrow">TRANSPARENT BY DESIGN</span>
				<h1>Real posts.<br /><span>Real extension output.</span></h1>
				<p>A demo that only works on the happy path tells you nothing. Here is a library of real, publicly documented posts — each run through Proper Gander&rsquo;s browser-extension analysis pipeline — with the unedited output recorded for anyone to check.</p>
			</div>

			<div className="method-notice">
				<FlaskConical size={20} />
				<div>
					<strong>{evaluationMeta.label} — {evaluationMeta.version}</strong>
					<p>{evaluationMeta.summary} Captured {evaluationMeta.capturedAt}.</p>
				</div>
			</div>

			<section className="method-section">
				<h2><Info size={18} />How the library was built</h2>
				<ol className="method-steps">
					<li><strong>Source real posts.</strong><p>Each entry is a real, publicly documented social post or public statement, cited to the fact-checker or news outlet that recorded it (PolitiFact, Reuters, PBS, Al Jazeera). The post text is quoted from that source.</p></li>
					<li><strong>Run through the extension pipeline.</strong><p>Each post&rsquo;s text was sent to <code>POST /api/extension/analyze</code> &mdash; the same endpoint the Proper Gander browser extension calls. The analysis shown is the model&rsquo;s genuine output, captured on {evaluationMeta.capturedAt}, not hand-written.</p></li>
					<li><strong>Record verbatim.</strong><p>The post text, the source link and the unedited extension output are recorded here. Nothing is retouched. You can re-run any post through the extension and compare.</p></li>
					<li><strong>Stay honest about limits.</strong><p>Outputs are non-deterministic; the extension analyses text only (it cannot confirm a synthetic voice or a manipulated image from text alone); this is a small set, not a production benchmark.</p></li>
				</ol>
			</section>

			<section className="method-section">
				<h2><ShieldCheck size={18} />Outcome summary</h2>
				<p>Each of the {evaluationMeta.total} posts is labelled by how the extension&rsquo;s analysis compared with the cited ground truth. A post counts as <em>flagged</em> only when its analysis alleges manipulation (a verdict such as Propaganda, Technique identified, Misleading or Contradicted); neutral fact-checks (Verified, Needs independent verification) do not count as flagging manipulation. The badge the extension shows can still turn amber on a clean post that receives a neutral fact-check &mdash; that is a presentation tendency, not counted as a false positive here.</p>
				<div className="outcome-tally-grid">
					{outcomeTallies.map(tally => (
						<div className={`outcome-tally outcome-${tally.outcome}`} key={tally.outcome}>
							<strong>{tally.count}</strong>
							<span className="eval-outcome">{tally.label}</span>
						</div>
					))}
				</div>
			</section>

			<section className="method-section">
				<h2><ShieldCheck size={18} />Performance statistics</h2>
				<p>These figures describe this {evaluationStats.total}-post library only &mdash; a small, curated set of clear-cut cases, not a production benchmark. They are computed directly from the outcome labels above. Re-running the same posts can shift a verdict, since the analysis is non-deterministic.</p>
				<div className="metric-grid">
					<div className="metric-card">
						<span className="metric-card-head">Precision</span>
						<span className="metric-value">{pct(evaluationStats.precision)}</span>
						<p>Of the {evaluationStats.truePositives + evaluationStats.falsePositives} posts the extension flagged as manipulation, {evaluationStats.truePositives} truly were. The remaining {evaluationStats.falsePositives} was a false positive.</p>
					</div>
					<div className="metric-card">
						<span className="metric-card-head">False-positive rate</span>
						<span className="metric-value">{pct(evaluationStats.falsePositiveRate)}</span>
						<p>Of the {evaluationStats.trueNegatives + evaluationStats.falsePositives} clean (non-manipulative) posts, {evaluationStats.falsePositives} was incorrectly flagged as manipulation.</p>
					</div>
					<div className="metric-card">
						<span className="metric-card-head">Recall</span>
						<span className="metric-value">{pct(evaluationStats.recall)}</span>
						<p>Of the {evaluationStats.truePositives + evaluationStats.falseNegatives} genuinely manipulative posts, {evaluationStats.truePositives} were flagged. The remaining {evaluationStats.falseNegatives} was missed (a false negative).</p>
					</div>
					<div className="metric-card">
						<span className="metric-card-head">Accuracy</span>
						<span className="metric-value">{pct(evaluationStats.accuracy)}</span>
						<p>Of all {evaluationStats.total} posts, {evaluationStats.truePositives + evaluationStats.trueNegatives} were labelled correctly &mdash; manipulation correctly flagged, and clean content correctly cleared.</p>
					</div>
				</div>
			</section>

			<section className="method-section">
				<h2>The evidence library</h2>
				<p className="method-table-intro">{evaluationMeta.total} real posts, each with its source and the extension&rsquo;s actual analysis. Every finding below was produced by the extension pipeline &mdash; not written by hand.</p>
				<div className="eval-table-wrap">
					<table className="eval-table">
						<thead>
							<tr><th>#</th><th>Post &amp; source</th><th>Category</th><th>Outcome</th><th>Extension output</th></tr>
						</thead>
						<tbody>
							{evaluationSet.map((item, index) => (
								<tr key={item.id} className={`outcome-${item.outcome}`}>
									<td className="eval-num">{index + 1}</td>
									<td className="eval-text">
										<span className="eval-post-text">&ldquo;{item.text}&rdquo;</span>
										<a className="eval-source" href={item.source.url} target="_blank" rel="noreferrer">{item.source.title} <ExternalLink size={11} /></a>
										<span className="eval-notes">{item.postDate} &middot; {item.platform} &mdash; {item.context}</span>
									</td>
									<td className="eval-cat">{item.category}</td>
									<td className="eval-outcome-cell"><span className="eval-outcome" title={outcomeLabel(item.outcome)}>{outcomeShort[item.outcome]}</span></td>
									<td className="eval-output">
										{item.verified && item.analysis ? (
											<>
												<p className="eval-summary">{item.analysis.summary}</p>
												<ul className="eval-findings">
													{item.analysis.findings.map((finding, i) => (
														<li key={i} className="eval-finding">
															<span className={`verdict-label ${kindTone[finding.kind] ?? ''}`}>{finding.verdict}</span>
															<span className="eval-finding-title">{finding.title}</span>
														</li>
													))}
												</ul>
												{item.analysis.findings.some(finding => finding.sources.length > 0) && (
													<div className="eval-sources">
														{item.analysis.findings.flatMap(finding => finding.sources).map((source, i) => (
															<a key={i} href={source.url} target="_blank" rel="noreferrer">{source.title} <ExternalLink size={10} /></a>
														))}
													</div>
												)}
											</>
										) : (
											<span className="eval-notes">Not verified &mdash; no extension output captured for this post.</span>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</section>

			<section className="method-section">
				<h2><ShieldCheck size={18} />Detection by category</h2>
				<p>What the extension actually found, grouped by the manipulation family each real post represents. For manipulation families the bar is recall (higher is better): of the genuinely manipulative posts, how many were flagged. For the <em>Legitimate content</em> family the same bar is the false-positive rate (lower is better): of the clean posts, how many were incorrectly flagged. &ldquo;Flagged&rdquo; means the analysis alleged manipulation, not merely that it returned any finding.</p>
				<div className="category-bars">
					{evaluationBreakdown.map(row => (
						<div className="category-row" key={row.category}>
							<span className="category-name">{row.category}</span>
							<div className="category-track">
								<div className="category-fill" style={{ width: `${Math.round(row.recall * 100)}%` }} />
							</div>
							<span className="category-stat">{row.detected}/{row.total} &middot; {pct(row.recall)}</span>
						</div>
					))}
				</div>
			</section>

			<div className="learning-closing">
				<h2>Bring a post and judge for yourself.</h2>
				<div className="closing-actions">
					<a className="secondary-button" href="/api/presentation/download" download><Presentation size={16} />Download project deck</a>
					<Link className="primary-button" to="/">Analyze a post<ArrowUpRight size={17} /></Link>
				</div>
			</div>
		</main>
	);
}
