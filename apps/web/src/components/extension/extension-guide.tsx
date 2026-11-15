import { Puzzle, ShieldCheck, EyeOff, ScanLine, ArrowUpRight, Download, Check, LockKeyhole } from 'lucide-react';
import { Link } from 'react-router';

const STEPS = [
	{ n: '1', title: 'Download the extension', body: 'Click “Download extension” above to get proper-gander-extension.zip — a ready-to-load folder with this site’s address already filled in.' },
	{ n: '2', title: 'Unzip and open Chrome / Edge / Brave extensions', body: 'Unzip the file, then visit chrome://extensions (or edge://extensions). Turn on “Developer mode” in the top-right corner.' },
	{ n: '3', title: 'Load unpacked', body: 'Click “Load unpacked” and select the unzipped folder. The Proper Gander icon appears in your toolbar.' },
	{ n: '4', title: 'Add your link token', body: 'Open the Proper Gander popup from the toolbar and paste your link token (from Settings → Browser extension). The web app URL is already filled in.' },
	{ n: '5', title: 'Browse as usual', body: 'Open X, Bluesky, Facebook, Instagram, LinkedIn or Reddit. Posts get a Proper Gander badge — the AI analyses each post as you scroll and flags misinformation.' },
];

export function ExtensionGuide() {
	return (
		<main className="page-content secondary-page">
			<div className="page-title">
				<span className="eyebrow">IN-PLACE CONTEXT, ON THE SOCIAL SITES</span>
				<h1>Proper Gander in your feed.<br /><span>Right where you already scroll.</span></h1>
				<p>A lightweight browser extension adds discreet, dismissible context badges alongside posts on X, Bluesky, Facebook, Instagram, LinkedIn and Reddit — without changing how the sites look.</p>
			</div>

			<div className="integration-feature bracket-frame">
				<span className="bluesky-logo"><Puzzle size={34} strokeWidth={1.6} /></span>
				<div>
					<span className="available-badge"><span className="tiny-dot" />Browser extension</span>
					<h2>Overlays, not a separate app</h2>
					<p>The extension reads the posts already on your screen and adds a small badge to each one. An AI agent analyses every post as you scroll &mdash; detecting manipulation techniques, rhetorical signals and checkable claims, and verifying them against the web. Click the badge for a compact panel. The original post stays fully visible and untouched.</p>
					<div className="feature-checks">
						<span><Check size={14} />AI-powered detection</span>
						<span><Check size={14} />Dismissible per post</span>
						<span><Check size={14} />Scans comments too</span>
						<span><Check size={14} />Sourced verdicts</span>
					</div>
				</div>
				<div className="extension-actions">
					<a className="primary-button" href="/api/extension/download" download><Download size={17} />Download extension</a>
					<a className="secondary-button" href="#install">Install guide</a>
				</div>
			</div>

			<section className="integration-list" id="install">
				<h2>Install in five steps.</h2>
				<p>Download, unzip, load it unpacked. It takes about a minute.</p>
				<div className="help-steps">
					{STEPS.map(step => (
						<div key={step.n}>
							<strong>{step.n}. {step.title}</strong>
							<p>{step.body}</p>
						</div>
					))}
				</div>
				<p className="privacy-note"><LockKeyhole size={16} />Manifest V3 · host permissions only for the social sites above · post text and image URLs are sent to your Proper Gander AI for analysis.</p>
			</section>

			<section className="extension-demo" aria-label="Overlay preview">
				<div className="demo-post">
					<div className="demo-author"><span className="post-avatar">DD</span><div className="post-author"><strong>The Daily Dispatch</strong><span>@daily_dispatch · X</span></div></div>
					<p className="demo-text">They don’t want you to know this: volcanoes release more CO₂ than all human activity combined. 90% of scientists agree it’s a hoax. WAKE UP before it’s too late.</p>
					<div className="demo-badge-row">
						<span className="demo-badge"><span className="demo-dot demo-dot-warn" />Worth a closer look</span>
						<span className="demo-hint">← the badge Proper Gander adds</span>
					</div>
				</div>
				<div className="demo-panel" aria-label="Proper Gander overlay preview">
					<div className="demo-panel-head"><span className="demo-title"><ScanLine size={14} />Proper Gander context</span></div>
					<a className="demo-disprove" href="https://www.epa.gov/ghgemissions" target="_blank" rel="noreferrer">
						<span className="demo-disprove-icon">⚠</span>
						<span><strong>Misinformation detected</strong><em>See the evidence that disproves this ↗</em><small>U.S. EPA — Greenhouse Gas Emissions</small></span>
					</a>
					<ul className="demo-list">
						<li className="cf-demo cf-warning"><span className="cf-demo-dot" /><div><span className="cf-demo-kind">Rhetorical signal</span><strong>Urgency and alarm</strong><p>Phrases that push you to react fast can discourage checking the evidence first.</p></div></li>
						<li className="cf-demo cf-technique"><span className="cf-demo-dot" /><div><span className="cf-demo-kind">Manipulation technique</span><strong>Appeal to a hidden enemy</strong><p>An unnamed “they” implies a secret plot without naming who or how to test it.</p></div></li>
						<li className="cf-demo cf-fact"><span className="cf-demo-dot" /><div><span className="cf-demo-kind">Claim to verify</span><strong>Figure without a source</strong><p>“90%” is presented with no study, name or date. Verify independently before sharing.</p></div></li>
					</ul>
					<div className="demo-foot">AI-powered analysis · not a verdict. Verify before sharing.</div>
				</div>
			</section>

			<section className="integration-list">
				<h2>AI fact-checking, linked to your account.</h2>
				<p>Link the extension to your Proper Gander account and an AI agent browses the web to verify a post&rsquo;s claims &mdash; including the images attached to it. Caricatures of political leaders, manipulated photos and decontextualised imagery are flagged as propaganda, with sourced verdicts right inside the overlay.</p>
				<div className="help-steps">
					<div><strong>1. Download and load the extension</strong><p>Use the &ldquo;Download extension&rdquo; button above. The web app URL is pre-filled &mdash; you only need your link token.</p></div>
					<div><strong>2. Generate a link token</strong><p>In Proper Gander &rarr; Settings &rarr; Browser extension, create a link token. It ties the extension to your account&rsquo;s AI budget.</p></div>
					<div><strong>3. Paste it into the extension popup</strong><p>Click the Proper Gander toolbar icon and paste the token into the &ldquo;Link token&rdquo; field.</p></div>
					<div><strong>4. It runs automatically</strong><p>The AI analyses each post as you scroll &mdash; no button to press. The badge turns red &ldquo;Misinformation detected&rdquo; when claims are contradicted or propagandistic imagery is found, with a one-tap link to a retrieved source that disproves the claim.</p></div>
				</div>
				<div className="feature-checks" style={{ marginTop: 17 }}>
					<span><Check size={14} />Disproving source link on misinformation</span>
					<span><Check size={14} />Scans comments, not just posts</span>
					<span><Check size={14} />Faster, focused checks (top claims first)</span>
				</div>
				<p className="privacy-note"><LockKeyhole size={16} />Fact-checks run through your Proper Gander account and count toward its AI message budget. Post text and image URLs are sent to the AI service for verification; nothing is posted on your behalf.</p>
			</section>

			<section className="integration-boundaries">
				<EyeOff size={22} />
				<div>
					<h3>Honest about its limits.</h3>
					<p>The AI agent is a calm first pass &mdash; it flags rhetorical patterns worth questioning and verifies claims against the web. It is still a tool to help you think, not a final verdict. Always use your own judgement before sharing. A web app cannot inject overlays into another site&rsquo;s pages on its own; the extension is what makes in-place context possible.</p>
					<div className="boundaries-links">
						<Link to="/methodology">See how well it works &mdash; precision, recall &amp; false-positive rate on real posts<ArrowUpRight size={14} /></Link>
						<Link to="/learn">About manipulation techniques &amp; boundaries<ArrowUpRight size={14} /></Link>
					</div>
				</div>
			</section>

			<div className="learning-closing">
				<h2>Deeper analysis lives in your workspace.</h2>
				<Link className="primary-button" to="/">Open your feed<ArrowUpRight size={17} /></Link>
			</div>

			<div className="privacy-note"><ShieldCheck size={16} />No posting permissions. No social-media credentials. No automatic posting on your behalf.</div>
		</main>
	);
}
