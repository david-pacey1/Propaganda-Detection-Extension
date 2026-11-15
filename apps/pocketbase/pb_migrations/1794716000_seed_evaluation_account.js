/// <reference path="../pb_data/types.d.ts" />

/**
 * Seeds a verified Proper Gander account plus an extension link token used
 * ONLY to generate the public evaluation library on /methodology — i.e. to run
 * real, cited social posts through the same /api/extension/analyze pipeline the
 * browser extension uses, so the recorded analysis output is genuinely
 * extension-generated rather than hand-authored.
 *
 * The account is not advertised as a login; its password is random and the
 * owner resets it through "Forgot password?" if they ever want to sign in.
 */
migrate(
	(app) => {
		const users = app.findCollectionByNameOrId('users');
		const tokens = app.findCollectionByNameOrId('extension_tokens');
		const seedId = (key) => $security.sha256(key).substring(0, 15);

		let user;
		try {
			user = app.findAuthRecordByEmail('users', 'evaluation@propergander.local');
		} catch (_) {
			user = new Record(users);
			user.set('id', seedId('users:evaluation@propergander.local'));
			user.setEmail('evaluation@propergander.local');
			user.setPassword($security.randomString(32));
			user.set('name', 'Evaluation Library');
			user.set('verified', true);
			app.save(user);
		}

		// Create the link token if it does not already exist.
		try {
			app.findFirstRecordByData('extension_tokens', 'token', 'pg_eval_lib_7f3a9c2e8b1d4a6f5c0e9d8b7a6c5e4f');
		} catch (_) {
			const token = new Record(tokens);
			token.set('owner', user.id);
			token.set('token', 'pg_eval_lib_7f3a9c2e8b1d4a6f5c0e9d8b7a6c5e4f');
			token.set('label', 'Evaluation library generation');
			app.save(token);
		}
	},
	(app) => {
		try {
			const user = app.findAuthRecordByEmail('users', 'evaluation@propergander.local');
			app.delete(user); // cascadeDelete on extension_tokens.owner removes the token too
		} catch (_) {
			/* already gone */
		}
	},
);
