migrate((app) => {
	const users = app.findCollectionByNameOrId('users');

	let exists = null;
	try {
		exists = app.findCollectionByNameOrId('extension_tokens');
	} catch (_) {
		/* Collection not yet created. */
	}
	if (exists) return;

	const collection = new Collection({
		name: 'extension_tokens',
		type: 'base',
		listRule: "@request.auth.id != '' && owner = @request.auth.id",
		viewRule: "@request.auth.id != '' && owner = @request.auth.id",
		createRule: "@request.auth.id != '' && @request.body.owner = @request.auth.id",
		updateRule: "@request.auth.id != '' && owner = @request.auth.id && @request.body.owner:changed = false",
		deleteRule: "@request.auth.id != '' && owner = @request.auth.id",
		fields: [
			{ name: 'owner', type: 'relation', required: true, collectionId: users.id, maxSelect: 1, cascadeDelete: true },
			{ name: 'token', type: 'text', required: true, min: 32, max: 128 },
			{ name: 'label', type: 'text', required: false, max: 120 },
			{ name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
			{ name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
		],
		indexes: ['CREATE UNIQUE INDEX idx_extension_tokens_token ON extension_tokens (token)'],
	});
	app.save(collection);
}, (app) => {
	try {
		app.delete(app.findCollectionByNameOrId('extension_tokens'));
	} catch (_) {
		/* Already gone. */
	}
});
