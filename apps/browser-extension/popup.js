// Proper Gander popup — toggle overlays and set the web app URL.

var toggle = document.getElementById('toggle');
var appUrl = document.getElementById('appUrl');
var token = document.getElementById('token');
var openApp = document.getElementById('openApp');
var status = document.getElementById('status');

function renderState(state) {
	toggle.setAttribute('aria-pressed', state.cfEnabled !== false ? 'true' : 'false');
	appUrl.value = state.cfAppUrl || '';
	token.value = state.cfToken || '';
	openApp.href = state.cfAppUrl || '#';
	openApp.target = '_blank';
}

chrome.storage.local.get(['cfEnabled', 'cfAppUrl', 'cfToken'], renderState);

toggle.addEventListener('click', function () {
	var on = toggle.getAttribute('aria-pressed') === 'true';
	var next = !on;
	chrome.storage.local.set({ cfEnabled: next }, function () {
		toggle.setAttribute('aria-pressed', next ? 'true' : 'false');
		flash(next ? 'Overlays on' : 'Overlays paused');
	});
});

appUrl.addEventListener('change', function () {
	var value = appUrl.value.trim();
	if (value && !/^https?:\/\//.test(value)) {
		value = 'https://' + value;
		appUrl.value = value;
	}
	chrome.storage.local.set({ cfAppUrl: value }, function () {
		openApp.href = value || '#';
		flash('Saved');
	});
});

token.addEventListener('change', function () {
	var value = token.value.trim();
	chrome.storage.local.set({ cfToken: value }, function () {
		flash(value ? 'Token saved' : 'Token cleared');
	});
});

function flash(msg) {
	status.textContent = msg;
	setTimeout(function () {
		status.textContent = '';
	}, 1800);
}
