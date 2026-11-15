// Proper Gander content script.
//
// Scans the current social page for posts AND comments and injects a discreet
// badge + compact overlay (in a Shadow DOM, so the host site's styles never
// clash with ours and ours never leak to the page).
//
// Detection is performed entirely by the Proper Gander AI agent: every post (and
// substantial comment) is sent to the AI as it scrolls into view, and the
// agent returns the manipulation techniques, rhetorical signals and checkable
// claims it finds — plus sourced verification of any factual claims. There is
// no local keyword matching. Items with no signals show a calm "Clear" badge;
// when the AI contradicts a claim or flags propagandistic imagery, the badge
// turns red "Misinformation detected" and a prominent link to a retrieved
// source that disproves or contextualises the claim is surfaced at the top of
// the overlay.

(function () {
	'use strict';

	// `comment` is null on platforms where replies are the same element type as
	// posts (already scanned by the post selector). On platforms where comments
	// live in their own DOM, `comment.selector` / `comment.text` target them.
	var HOSTS = {
		'x.com': { name: 'X', post: 'article[data-testid="tweet"], article', text: '[data-testid="tweetText"]', comment: null },
		'twitter.com': { name: 'X', post: 'article[data-testid="tweet"], article', text: '[data-testid="tweetText"]', comment: null },
		'bsky.app': { name: 'Bluesky', post: '[data-testid^="feedItem-by"], [data-testid="postThreadItem"], [data-testid="postItem"]', text: '[data-testid="postText"], div[dir="auto"]', comment: null },
		'www.facebook.com': { name: 'Facebook', post: 'div[role="article"]', text: 'div[dir="auto"], span[dir="auto"]', comment: null, dedup: true },
		'www.instagram.com': { name: 'Instagram', post: 'article', text: 'ul li span, div[dir="auto"]', comment: { selector: 'ul li[role="listitem"], ul li', text: 'span[dir="auto"], span' } },
		'www.linkedin.com': { name: 'LinkedIn', post: 'div[role="article"], .feed-shared-update-v2', text: '.feed-shared-update-v2__description, .update-components-text, div[dir="auto"], span[dir="auto"]', comment: { selector: '.comments-comment-item, [data-id="comment"]', text: '.comments-comment-item__comment-content, span[dir="auto"]' }, dedup: true },
		'www.reddit.com': { name: 'Reddit', post: 'shreddit-post, [data-testid="post-container"], article', text: '[slot="title"], h1, h3, [data-testid="post-title"]', comment: { selector: 'shreddit-comment, [data-testid="comment"]', text: 'p, [data-testid="comment"] > div' } },
	};

	var host = HOSTS[location.hostname];
	if (!host) return;

	var enabled = true;
	var appUrl = '';
	var token = '';

	// When the AI budget is exhausted (429), pause auto-checks for a minute so
	// scrolling doesn't spam every post with a rate-limit error. Manual
	// "Analyze with AI" still works and re-enables auto-checks on success.
	var autoCheckPausedUntil = 0;

	// After an extension reload/update, a stale content script from the
	// previous version can still be running on an open tab. Its chrome.* APIs
	// are dead and throw "Extension context invalidated" on any call. Guard
	// every call so the stale script fails quietly instead of throwing an
	// uncaught error; refreshing the page loads the fresh script.
	function contextValid() {
		try {
			return !!(chrome.runtime && chrome.runtime.id);
		} catch (e) {
			return false;
		}
	}

	try {
		chrome.storage.local.get(['cfEnabled', 'cfAppUrl', 'cfToken'], function (res) {
			enabled = res.cfEnabled !== false;
			appUrl = res.cfAppUrl || '';
			token = res.cfToken || '';
			if (enabled) start();
		});
	} catch (e) {
		return; // context invalidated — refresh the page
	}

	// Keep the cached app URL / token fresh when the popup changes them, so
	// auto-checking picks up a newly linked token without a reload.
	try {
		chrome.storage.onChanged.addListener(function (changes, area) {
			if (area !== 'local') return;
			if (changes.cfAppUrl) appUrl = changes.cfAppUrl.newValue || '';
			if (changes.cfToken) token = changes.cfToken.newValue || '';
		});
	} catch (e) {
		/* context invalidated */
	}

	try {
		chrome.runtime.onMessage.addListener(function (msg, _sender, sendResponse) {
			if (msg && msg.type === 'cf-toggle') {
				enabled = !!msg.enabled;
				if (enabled) start();
				else removeAll();
				sendResponse({ ok: true });
			}
			return true;
		});
	} catch (e) {
		/* context invalidated */
	}

	var started = false;
	function start() {
		if (started) return;
		started = true;
		scan();
		var timer = null;
		var observer = new MutationObserver(function () {
			if (timer) return;
			timer = setTimeout(function () {
				timer = null;
				scan();
			}, 600);
		});
		observer.observe(document.body, { childList: true, subtree: true });
	}

	function scan() {
		var max = 200;
		var posts = document.querySelectorAll(host.post);
		for (var i = 0; i < posts.length && i < max; i++) {
			process(posts[i], false);
		}
		// Comments are scanned after posts so an element matched by both
		// selectors is only badged once (the post pass marks it first).
		if (host.comment) {
			var comments = document.querySelectorAll(host.comment.selector);
			for (var j = 0; j < comments.length && j < max; j++) {
				process(comments[j], true);
			}
		}
	}

	/**
	 * True when a post-matching ancestor exists within `maxLevels` of `el`.
	 * Bounded unlike `closest`, so only nearby wrappers (a feed card wrapping
	 * its article, or a post wrapping its comments) trigger dedup — a distant
	 * container that merely happens to match the post selector cannot swallow
	 * the real posts below it.
	 */
	function hasClosePostAncestor(el, selector, maxLevels) {
		var node = el.parentElement;
		var n = 0;
		while (node && n < maxLevels) {
			if (node.matches && node.matches(selector)) return true;
			node = node.parentElement;
			n++;
		}
		return false;
	}

	function process(el, isComment) {
		if (!el) return;
		// Elements with no analysable content are skipped once and for all.
		if (el.dataset.cfSkip === '1') return;
		// Avoid double-badging nested post containers (e.g. a feed card wrapping
		// its article, or a post wrapping its comments). When a host opts in via
		// `dedup`, a post whose ancestor also matches the post selector yields to
		// the ancestor — but only when that ancestor is nearby (within a few
		// levels). The bound matters: `closest` walks the whole chain, so a
		// distant wrapper that merely happens to match the post selector (a large
		// section container) would otherwise swallow every individual post below
		// it and leave no badge on the real posts. Comments are exempt — they
		// live inside posts and use their own selector.
		if (!isComment && host.dedup && hasClosePostAncestor(el, host.post, 4)) return;
		// If we already badged this element, only re-act when the badge has
		// vanished. React/SPA reconciliation can strip our injected node, and
		// without this check the badge would never come back after a re-render.
		var alreadyBadged = el.dataset.cfMarked === '1';
		if (alreadyBadged && el.querySelector(':scope > .cf-badge-host')) return;

		// Skip tiny/hidden containers. Comments use a smaller threshold.
		var rect = el.getBoundingClientRect();
		var minW = isComment ? 80 : 120;
		var minH = isComment ? 24 : 40;
		if (rect.width < minW || rect.height < minH) return;

		var textSelectors = isComment && host.comment ? host.comment.text : host.text;
		var text = extractText(el, textSelectors);
		var images = isComment ? [] : extractImages(el);

		// If we have neither usable text nor images, skip so we don't
		// reprocess, but don't badge — nothing to analyse.
		if ((!text || text.length < 12) && !images.length) {
			if (!alreadyBadged) el.dataset.cfSkip = '1';
			return;
		}

		el.dataset.cfMarked = '1';
		injectBadge(el, text || '', images, isComment);
	}

	function extractText(el, textSelectors) {
		var selectors = textSelectors.split(',').map(function (s) {
			return s.trim();
		});
		for (var i = 0; i < selectors.length; i++) {
			var node = el.querySelector(selectors[i]);
			if (node && node.textContent && node.textContent.trim().length > 8) {
				return node.textContent.trim().slice(0, 4000);
			}
		}
		var own = el.cloneNode(true);
		// Drop nested posts/comments to avoid grabbing a whole thread.
		var nested = own.querySelectorAll(host.post);
		nested.forEach(function (n) {
			n.remove();
		});
		if (host.comment) {
			var nestedComments = own.querySelectorAll(host.comment.selector);
			nestedComments.forEach(function (n) {
				n.remove();
			});
		}
		var t = own.textContent || '';
		t = t.replace(/\s+/g, ' ').trim();
		return t.length > 8 ? t.slice(0, 4000) : null;
	}

	/**
	 * Collects the main content images from a post (not avatars or icons).
	 * Returns up to 4 absolute http(s) URLs the AI agent can fetch.
	 */
	function extractImages(el) {
		var imgs = el.querySelectorAll('img');
		var seen = {};
		var urls = [];
		for (var i = 0; i < imgs.length && urls.length < 4; i++) {
			var img = imgs[i];
			// Skip tiny icons / avatars / emoji sprites.
			var w = img.naturalWidth || img.width || 0;
			var h = img.naturalHeight || img.height || 0;
			if (w && (w < 80 || h < 80)) continue;
			var src = img.currentSrc || img.src || '';
			if (!src) continue;
			// Resolve relative URLs and drop data: URIs (too large to forward
			// and the model fetches by URL).
			try {
				src = new URL(src, location.href).href;
			} catch (e) {
				continue;
			}
			if (!/^https?:\/\//i.test(src)) continue;
			if (seen[src]) continue;
			seen[src] = true;
			urls.push(src);
		}
		return urls;
	}

	function injectBadge(el, text, images, isComment) {
		var host2 = document.createElement('div');
		host2.className = 'cf-badge-host';
		// Anchor the badge to the element without disturbing layout.
		var cs = getComputedStyle(el);
		if (cs.position === 'static') el.style.position = 'relative';
		// Comments get a tighter, smaller badge so they don't crowd the thread.
		var top = isComment ? 4 : 8;
		var right = isComment ? 4 : 8;
		host2.style.cssText =
			'position:absolute;top:' + top + 'px;right:' + right + 'px;z-index:2147483646;pointer-events:auto;';
		el.appendChild(host2);

		var shadow = host2.attachShadow({ mode: 'open' });
		shadow.innerHTML = buildShadow(text, images, isComment);

		var badge = shadow.querySelector('.cf-badge');
		var panel = shadow.querySelector('.cf-panel');
		var closeBtn = shadow.querySelector('.cf-close');

		// Per-item state shared between the badge and the panel.
		var state = {
			status: 'local', // 'local' (not checked) | 'verifying' | 'reviewed' | 'misinformation'
			ai: null,
			text: text,
			images: images,
			checked: false,
			isComment: isComment,
		};

		badge.addEventListener('click', function (e) {
			e.preventDefault();
			e.stopPropagation();
			var open = panel.style.display !== 'none';
			panel.style.display = open ? 'none' : 'block';
			if (!open) reposition(panel, host2);
		});
		if (closeBtn) {
			closeBtn.addEventListener('click', function (e) {
				e.preventDefault();
				e.stopPropagation();
				panel.style.display = 'none';
			});
		}
		var aiBtn = shadow.querySelector('.cf-ai-btn');
		if (aiBtn) {
			aiBtn.addEventListener('click', function (e) {
				e.preventDefault();
				e.stopPropagation();
				runFactCheck(shadow, state, host.name);
			});
		}
		// Stop the host site from receiving clicks inside the panel.
		panel.addEventListener('click', function (e) {
			e.stopPropagation();
		});

		// Auto-run the AI analysis once, when the item scrolls into view and
		// the extension is linked. Posts auto-check with short text or any
		// images; comments need more text to conserve the AI budget across a
		// busy thread. Short items keep a neutral badge and can be checked
		// manually from the panel.
		var minText = 40;
		var shouldAutoCheck = (text && text.length >= minText) || (!isComment && images.length > 0);
		if (shouldAutoCheck) {
			scheduleAutoCheck(el, shadow, state, host.name);
		}
	}

	/**
	 * Triggers the AI analysis the first time the item is visible. Uses an
	 * IntersectionObserver so off-screen items never spend the AI budget.
	 */
	function scheduleAutoCheck(el, shadow, state, platform) {
		function tryRun() {
			if (state.checked) return;
			if (!contextValid()) return; // stale script after an extension reload
			if (!appUrl || !token) return; // not linked — leave the neutral badge
			if (Date.now() < autoCheckPausedUntil) return; // budget exhausted — wait
			state.checked = true;
			runFactCheck(shadow, state, platform);
		}

		if (typeof IntersectionObserver === 'undefined') {
			tryRun();
			return;
		}

		var io = new IntersectionObserver(
			function (entries) {
				for (var i = 0; i < entries.length; i++) {
					if (entries[i].isIntersecting) {
						tryRun();
						io.disconnect();
						break;
					}
				}
			},
			{ rootMargin: '100px' },
		);
		io.observe(el);
	}

	function reposition(panel, host2) {
		// Keep the panel on-screen on narrow layouts.
		var r = host2.getBoundingClientRect();
		var pr = panel.getBoundingClientRect();
		var vw = document.documentElement.clientWidth;
		if (r.left + pr.width > vw - 12) {
			panel.style.right = '0px';
			panel.style.left = 'auto';
		}
	}

	/** Updates the badge dot + label to reflect the current state. */
	function updateBadge(shadow, state) {
		var dot = shadow.querySelector('.cf-badge-dot');
		var label = shadow.querySelector('.cf-badge-label');
		var badge = shadow.querySelector('.cf-badge');
		if (!dot || !label) return;

		var dotColor, text;
		if (state.status === 'verifying') {
			dotColor = '#8a6fa6';
			text = 'Verifying…';
		} else if (state.status === 'misinformation') {
			dotColor = '#c0564a';
			text = state.isComment ? 'Misinfo' : 'Misinformation detected';
		} else if (state.status === 'reviewed') {
			var findings = state.ai && state.ai.findings ? state.ai.findings : [];
			if (findings.length) {
				dotColor = '#b07a3f';
				text = state.isComment ? 'Flagged' : 'Worth a closer look';
			} else {
				dotColor = '#6f8a5e';
				text = 'Clear';
			}
		} else {
			// Not yet analysed — neutral badge, no verdict claimed.
			dotColor = '#8a6fa6';
			text = 'Proper Gander';
		}

		dot.style.background = dotColor;
		label.textContent = text;
		if (state.status === 'verifying') badge.classList.add('cf-badge-busy');
		else badge.classList.remove('cf-badge-busy');
	}

	function buildShadow(text, images, isComment) {
		// Neutral pre-analysis state: the AI has not run yet, so we make no
		// claim about the post. The badge updates once the AI returns.
		var dotColor = '#8a6fa6';
		var label = 'Proper Gander';

		var learnLink = '';
		if (appUrl) {
			learnLink =
				'<a class="cf-learn" href="' + escapeHtml(appUrl) + '/learn" target="_blank" rel="noreferrer">Learn the techniques ↗</a>';
		}

		var imageNote = images.length
			? '<p class="cf-images-note">' + images.length + (images.length === 1 ? ' image' : ' images') + ' attached — included in the AI check.</p>'
			: '';

		var badgeClass = isComment ? 'cf-badge cf-badge-small' : 'cf-badge';

		return (
			'<style>' + SHADOW_CSS + '</style>' +
			'<button class="' + badgeClass + '" type="button" title="Proper Gander context" aria-label="Proper Gander context">' +
			'<span class="cf-badge-dot" style="background:' + dotColor + '"></span>' +
			'<span class="cf-badge-label">' + label + '</span>' +
			'</button>' +
			'<div class="cf-panel" style="display:none" role="dialog" aria-label="Proper Gander context">' +
			'<div class="cf-head">' +
			'<span class="cf-title">' + (isComment ? 'Proper Gander · comment' : 'Proper Gander context') + '</span>' +
			'<button class="cf-close" type="button" aria-label="Close">✕</button>' +
			'</div>' +
			'<div class="cf-ai">' +
			'<button class="cf-ai-btn" type="button">Analyze with AI</button>' +
			'<div class="cf-ai-body"><p class="cf-ai-empty">Run an AI analysis to detect manipulation techniques, rhetorical signals and checkable claims — and verify them against the web.</p></div>' +
			'</div>' +
			imageNote +
			'<div class="cf-foot">' +
			'<span>AI-powered analysis · not a final verdict. Verify before sharing.</span>' +
			learnLink +
			'</div>' +
			'</div>'
		);
	}

	function renderFindings(findings) {
		if (!findings || !findings.length) {
			return '<li class="cf-item cf-clear"><span class="cf-dot" style="background:#6f8a5e"></span><div><span class="cf-kind">AI check</span><strong>No checkable claims found</strong><p>The AI agent found no claims or signals worth flagging in this post.</p></div></li>';
		}
		return findings
			.map(function (f) {
				var kindLabel =
					f.kind === 'warning'
						? 'Rhetorical signal'
						: f.kind === 'technique'
							? 'Manipulation technique'
							: 'Claim to verify';
				var tone =
					f.kind === 'warning'
						? '#b07a3f'
						: f.kind === 'technique'
							? '#8a6fa6'
							: '#6f8a5e';
				var quote = f.quote ? '<div class="cf-quote">“' + escapeHtml(f.quote) + '”</div>' : '';
				var sources = '';
				if (f.sources && f.sources.length) {
					sources = '<div class="cf-ai-sources">';
					for (var j = 0; j < f.sources.length; j++) {
						var s = f.sources[j];
						sources += '<a href="' + escapeHtml(s.url) + '" target="_blank" rel="noreferrer">' + escapeHtml(s.title || s.url) + ' ↗</a>';
					}
					sources += '</div>';
				}
				var verdict = f.verdict ? '<span class="cf-verdict">' + escapeHtml(f.verdict) + '</span>' : '';
				return (
					'<li class="cf-item cf-' + f.kind + '">' +
					'<span class="cf-dot" style="background:' + tone + '"></span>' +
					'<div>' +
					'<span class="cf-kind">' + kindLabel + '</span>' +
					verdict +
					'<strong>' + escapeHtml(f.title) + '</strong>' +
					quote +
					'<p>' + escapeHtml(f.explanation) + '</p>' + sources +
					'</div>' +
					'</li>'
				);
			})
			.join('');
	}

	/**
	 * True when the AI analysis returns a finding whose verdict indicates
	 * misinformation or propagandistic imagery.
	 */
	function isMisinformation(analysis) {
		if (!analysis || !analysis.findings) return false;
		return analysis.findings.some(function (f) {
			var v = String(f.verdict || '').toLowerCase();
			return (
				v.indexOf('contradict') >= 0 ||
				v.indexOf('mislead') >= 0 ||
				v.indexOf('disput') >= 0 ||
				v.indexOf('propaganda') >= 0 ||
				v.indexOf('manipulat') >= 0 ||
				v.indexOf('false') >= 0 ||
				v.indexOf('fabricat') >= 0 ||
				v.indexOf('deepfake') >= 0
			);
		});
	}

	/**
	 * Returns the first source attached to a finding whose verdict indicates
	 * misinformation — the retrieved link that disproves or contextualises the
	 * claim. Used to surface a prominent "see the evidence" link.
	 */
	function findDisprovingSource(analysis) {
		if (!analysis || !analysis.findings) return null;
		for (var i = 0; i < analysis.findings.length; i++) {
			var f = analysis.findings[i];
			var v = String(f.verdict || '').toLowerCase();
			var isMisinfo =
				v.indexOf('contradict') >= 0 ||
				v.indexOf('mislead') >= 0 ||
				v.indexOf('disput') >= 0 ||
				v.indexOf('propaganda') >= 0 ||
				v.indexOf('manipulat') >= 0 ||
				v.indexOf('false') >= 0 ||
				v.indexOf('fabricat') >= 0 ||
				v.indexOf('deepfake') >= 0;
			if (isMisinfo && f.sources && f.sources.length) {
				return f.sources[0];
			}
		}
		return null;
	}

	function runFactCheck(shadow, state, platform) {
		var body = shadow.querySelector('.cf-ai-body');
		var btn = shadow.querySelector('.cf-ai-btn');
		if (!body || !btn) return;

		// If the extension isn't linked, surface that clearly instead of a
		// generic failure.
		if (!appUrl || !token) {
			body.innerHTML = '<p class="cf-ai-error">Link this extension first — add your Proper Gander link token in the popup.</p>';
			return;
		}

		state.status = 'verifying';
		updateBadge(shadow, state);
		btn.disabled = true;
		btn.textContent = 'Checking…';
		body.innerHTML = '<p class="cf-ai-loading"><span class="cf-spin"></span>The AI agent is detecting manipulation techniques and verifying claims' + (state.images.length ? ' and images' : '') + '…</p>';

		// Delegate the fetch to the background service worker: content scripts
		// are subject to the host page's CORS in Manifest V3. Wrap the call so
		// that an invalidated extension context (after a reload/update) is
		// reported cleanly instead of throwing an uncaught error.
		try {
			chrome.runtime.sendMessage(
				{ type: 'cf-factcheck', text: state.text, images: state.images, platform: platform, url: location.href },
				function (response) {
					if (chrome.runtime.lastError || !response) {
						state.status = 'local';
						updateBadge(shadow, state);
						body.innerHTML = '<p class="cf-ai-error">Could not reach the Proper Gander worker. Reload the page and try again.</p>';
						btn.textContent = 'Analyze with AI';
						btn.disabled = false;
						return;
					}
					if (response.error) {
						state.status = 'local';
						updateBadge(shadow, state);
						// Pause auto-checks when the AI budget is exhausted so scrolling
						// doesn't repeat the error on every post.
						if (/too many|rate|429/i.test(response.error)) {
							autoCheckPausedUntil = Date.now() + 60000;
						}
						body.innerHTML = '<p class="cf-ai-error">' + escapeHtml(response.error) + '</p>';
						btn.textContent = 'Analyze with AI';
						btn.disabled = false;
						return;
					}
					state.ai = response.analysis;
					state.status = isMisinformation(response.analysis) ? 'misinformation' : 'reviewed';
					updateBadge(shadow, state);
					// A successful check means the budget has reset — re-enable auto-checks.
					autoCheckPausedUntil = 0;
					body.innerHTML = renderAI(response.analysis);
					btn.textContent = 'Re-run AI analysis';
					btn.disabled = false;
				},
			);
		} catch (e) {
			// Extension context invalidated — the extension was reloaded/updated
			// while this tab stayed open. Pause auto-checks so we don't keep
			// throwing on every post, and tell the user to refresh.
			autoCheckPausedUntil = Date.now() + 60000;
			state.status = 'local';
			updateBadge(shadow, state);
			body.innerHTML = '<p class="cf-ai-error">Proper Gander was updated. Refresh the page to re-enable analysis.</p>';
			btn.textContent = 'Analyze with AI';
			btn.disabled = false;
		}
	}

	function renderAI(analysis) {
		var html = '';
		if (analysis.summary) html += '<p class="cf-ai-summary">' + escapeHtml(analysis.summary) + '</p>';

		// When misinformation is detected, surface a prominent link to a
		// retrieved source that disproves or contextualises the claim, so the
		// reader can verify the correction in one click.
		var disproving = findDisprovingSource(analysis);
		if (disproving) {
			html +=
				'<a class="cf-disprove" href="' + escapeHtml(disproving.url) + '" target="_blank" rel="noreferrer">' +
				'<span class="cf-disprove-icon">⚠</span>' +
				'<span><strong>Misinformation detected</strong>' +
				'<em>See the evidence that disproves this ↗</em>' +
				'<small>' + escapeHtml(disproving.title || disproving.url) + '</small></span>' +
				'</a>';
		}

		if (analysis.findings && analysis.findings.length) {
			html += '<div class="cf-section-label">AI verdict</div><ul class="cf-ai-list">';
			html += renderFindings(analysis.findings);
			html += '</ul>';
		} else {
			html += '<p class="cf-ai-empty">No checkable claims or signals found in this post.</p>';
		}
		return html;
	}

	function removeAll() {
		var hosts = document.querySelectorAll('.cf-badge-host');
		hosts.forEach(function (h) {
			h.remove();
		});
		var marked = document.querySelectorAll('[data-cf-marked]');
		marked.forEach(function (m) {
			delete m.dataset.cfMarked;
		});
	}

	function escapeHtml(s) {
		return String(s)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
	}

	var SHADOW_CSS =
		':host{all:initial}' +
		'.cf-badge{display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.92);border:1px solid #e2d6ea;border-radius:999px;padding:3px 9px 3px 7px;font:600 10px/1 Manrope,system-ui,sans-serif;color:#6a5a78;cursor:pointer;box-shadow:0 1px 4px rgba(76,57,89,.12);backdrop-filter:blur(4px);}' +
		'.cf-badge-small{padding:2px 7px 2px 5px;font-size:9px;gap:4px}' +
		'.cf-badge-small .cf-badge-dot{width:5px;height:5px}' +
		'.cf-badge:hover{background:#fff;border-color:#cdbade;color:#4c3959}' +
		'.cf-badge-busy{border-color:#c9b5d6;color:#7a568c}' +
		'.cf-badge-dot{width:6px;height:6px;border-radius:50%;display:inline-block}' +
		'.cf-badge-label{white-space:nowrap}' +
		'.cf-panel{position:absolute;top:30px;right:0;width:300px;max-width:78vw;max-height:calc(100dvh - 48px);overflow-y:auto;overscroll-behavior:contain;background:#fffdfb;border:1px solid #e2d6ea;border-radius:12px;box-shadow:0 12px 32px rgba(76,57,89,.18);padding:14px 14px 12px;font:400 12px/1.5 Manrope,system-ui,sans-serif;color:#4c3959;z-index:2147483647}' +
		'.cf-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}' +
		'.cf-title{font-size:11px;font-weight:700;color:#7a568c;letter-spacing:.2px}' +
		'.cf-close{border:0;background:none;font-size:13px;color:#9c8aa6;cursor:pointer;padding:2px 4px;border-radius:4px}' +
		'.cf-close:hover{background:#f3edf7;color:#4c3959}' +
		'.cf-section-label{font-size:8px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:#9c8aa6;margin:4px 0 6px}' +
		'.cf-list{list-style:none;margin:0 0 4px;padding:0;display:flex;flex-direction:column;gap:10px}' +
		'.cf-item{display:flex;gap:8px;align-items:flex-start}' +
		'.cf-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:4px}' +
		'.cf-kind{display:block;font-size:8px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:#9c8aa6;margin-bottom:2px}' +
		'.cf-verdict{display:inline-block;font-size:8px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;background:#f1e9f5;color:#9978aa;border-radius:3px;padding:2px 5px;margin-bottom:4px}' +
		'.cf-item strong{display:block;font-size:12px;font-weight:600;color:#5b4a68}' +
		'.cf-quote{font-size:11px;color:#7d6c82;background:#f6f1fa;border-radius:5px;padding:4px 7px;margin:4px 0;font-style:italic}' +
		'.cf-item p{margin:5px 0 0;font-size:11px;line-height:1.55;color:#877390}' +
		'.cf-foot{margin-top:11px;padding-top:9px;border-top:1px solid #f0e9f3;display:flex;flex-direction:column;gap:6px}' +
		'.cf-foot span{font-size:9px;line-height:1.5;color:#a99bb3}' +
		'.cf-learn{font-size:10px;font-weight:600;color:#8a6ba0;text-decoration:none}' +
		'.cf-learn:hover{text-decoration:underline}' +
		'.cf-images-note{font-size:9px;color:#a99bb3;margin:8px 0 0}' +
		'.cf-ai{margin-top:11px;padding-top:11px;border-top:1px solid #f0e9f3}' +
		'.cf-ai-btn{width:100%;border:1px solid #cdbade;background:#fff;border-radius:7px;padding:9px;font:600 11px/1 Manrope,system-ui,sans-serif;color:#7a568c;cursor:pointer}' +
		'.cf-ai-btn:hover:not(:disabled){background:#f4eff8}' +
		'.cf-ai-btn:disabled{opacity:.6;cursor:default}' +
		'.cf-ai-body{margin-top:9px}' +
		'.cf-ai-loading{display:flex;gap:7px;align-items:center;font-size:11px;color:#8a6ba0}' +
		'.cf-spin{width:12px;height:12px;border:2px solid #e2d6ea;border-top-color:#8a6ba0;border-radius:50%;display:inline-block;animation:cf-rot 1s linear infinite}' +
		'.cf-ai-error{font-size:11px;color:#b17f6c;background:#faf0ec;border-radius:5px;padding:7px;margin:0}' +
		'.cf-ai-summary{font-size:11px;line-height:1.6;color:#5b4a68;background:#f6f1fa;border-radius:5px;padding:7px;margin:0 0 9px}' +
		'.cf-ai-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:9px}' +
		'.cf-ai-sources{display:flex;flex-wrap:wrap;gap:6px;margin-top:5px}' +
		'.cf-ai-sources a{font-size:9px;font-weight:600;color:#8a6ba0;text-decoration:none;background:#f3edf7;border-radius:4px;padding:3px 6px}' +
		'.cf-ai-sources a:hover{text-decoration:underline}' +
		'.cf-ai-empty{font-size:11px;color:#9c8aa6;margin:0}' +
		// Prominent disproving-source banner shown when misinformation is detected.
		'.cf-disprove{display:flex;gap:8px;align-items:flex-start;background:#fbeef0;border:1px solid #e6c3c4;border-radius:8px;padding:9px 10px;margin:0 0 10px;text-decoration:none;color:#9c4a44}' +
		'.cf-disprove-icon{font-size:14px;line-height:1.4;color:#c0564a;flex-shrink:0}' +
		'.cf-disprove strong{display:block;font-size:11px;font-weight:700;color:#b03a34;margin-bottom:2px}' +
		'.cf-disprove em{display:block;font-style:normal;font-size:11px;font-weight:600;color:#9c4a44;text-decoration:underline}' +
		'.cf-disprove small{display:block;font-size:9px;color:#b07a7a;margin-top:3px;word-break:break-all}' +
		'.cf-disprove:hover{background:#f9e7ea}' +
		'@keyframes cf-rot{to{transform:rotate(360deg)}}';
})();
