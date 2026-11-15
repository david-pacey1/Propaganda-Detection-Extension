// Proper Gander background service worker.
// Keeps default settings, forwards messages between the popup and content
// scripts, and performs the AI fact-check fetch on behalf of content scripts.
//
// The fact-check request MUST run here, not in the content script: content
// scripts are subject to the host page's CORS in Manifest V3, and the
// Proper Gander API returns Cross-Origin-Resource-Policy. A background service
// worker with host_permissions makes the request with the extension's own
// privileges, bypassing CORS so the call actually reaches the server.

// The web app URL is injected here when the extension is downloaded from the
// Proper Gander site, so a fresh install is pre-linked and the user only needs to
// paste their link token. Left blank for the repo source.
const DEFAULT_APP_URL = '';

chrome.runtime.onInstalled.addListener(() => {
	chrome.storage.local.get(['cfEnabled', 'cfAppUrl'], (res) => {
		const patch = {};
		if (res.cfEnabled === undefined) patch.cfEnabled = true;
		if (DEFAULT_APP_URL && (res.cfAppUrl === undefined || res.cfAppUrl === '')) {
			patch.cfAppUrl = DEFAULT_APP_URL;
		}
		if (Object.keys(patch).length) chrome.storage.local.set(patch);
	});
});

// Relay enable/disable changes to every tab so overlays update immediately.
chrome.storage.onChanged.addListener((changes, area) => {
	if (area !== 'local' || !('cfEnabled' in changes)) return;
	chrome.tabs.query({}, (tabs) => {
		for (const tab of tabs) {
			if (!tab.id || !tab.url) continue;
			chrome.tabs
				.sendMessage(tab.id, { type: 'cf-toggle', enabled: changes.cfEnabled.newValue })
				.catch(() => {
					/* tab not on a supported host or content script not loaded */
				});
		}
	});
});

// Fact-check a post on behalf of a content script. Runs here so the request
// uses the extension's host_permissions instead of the host page's origin.
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
	if (msg && msg.type === 'cf-factcheck') {
		handleFactCheck(msg)
			.then(sendResponse)
			.catch((err) => sendResponse({ error: err && err.message ? err.message : 'Fact-check failed.' }));
		return true; // keep the message channel open for the async response
	}
	return false;
});

async function handleFactCheck(msg) {
	const stored = await chrome.storage.local.get(['cfAppUrl', 'cfToken']);
	const appUrl = stored.cfAppUrl || '';
	const token = stored.cfToken || '';

	if (!appUrl || !token) {
		return { error: 'Link this extension first — add your Proper Gander link token in the popup.' };
	}

	const base = appUrl.replace(/\/+$/, '');
	let res;

	// Send the payload as application/x-www-form-urlencoded. This is a
	// CORS-safelisted content type, so the browser sends no preflight, AND it
	// is the standard HTML form post content type that publishing proxies and
	// CDNs forward intact — a text/plain or application/json body was arriving
	// empty at the server through the publishing proxy, which then failed with
	// a 400 "Invalid JSON body". The token travels in the body (no Authorization
	// header, keeping the request simple).
	const form = new URLSearchParams();
	form.set('token', token);
	form.set('text', msg.text || '');
	if (msg.platform) form.set('platform', msg.platform);
	if (msg.url) form.set('url', msg.url);
	// Images arrive as an array of public image URLs collected from the post.
	if (Array.isArray(msg.images) && msg.images.length) {
		form.set('images', JSON.stringify(msg.images.slice(0, 4)));
	}

	try {
		res = await fetch(base + '/api/extension/analyze', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: form.toString(),
		});
	} catch (err) {
		throw new Error(
			'Could not reach your Proper Gander site. Check the web app URL in the popup is correct and the site is online.',
		);
	}

	if (res.status === 401) throw new Error('Extension link invalid. Regenerate it in Proper Gander settings.');
	if (res.status === 403) throw new Error('Verify your Proper Gander email to use AI fact-checking.');
	if (res.status === 429) throw new Error('Too many requests. Wait a minute and try again.');
	if (!res.ok) throw new Error('Fact-check failed (' + res.status + '). Try again.');

	const analysis = await res.json();
	return { analysis: analysis };
}
