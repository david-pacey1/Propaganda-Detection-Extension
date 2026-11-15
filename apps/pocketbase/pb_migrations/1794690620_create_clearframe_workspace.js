migrate((app) => {
  const users = app.findCollectionByNameOrId('users');
  for (const name of ['saved_analyses', 'reading_preferences']) {
    let exists = null;
    try { exists = app.findCollectionByNameOrId(name); } catch (_) { /* Collection not yet created. */ }
    if (exists) continue;
    const collection = new Collection({
      name, type: 'base',
      listRule: "@request.auth.id != '' && owner = @request.auth.id",
      viewRule: "@request.auth.id != '' && owner = @request.auth.id",
      createRule: "@request.auth.id != '' && @request.body.owner = @request.auth.id",
      updateRule: "@request.auth.id != '' && owner = @request.auth.id && @request.body.owner:changed = false",
      deleteRule: "@request.auth.id != '' && owner = @request.auth.id",
      fields: [
        { name: 'owner', type: 'relation', required: true, collectionId: users.id, maxSelect: 1, cascadeDelete: true },
        { name: 'payload', type: 'json', required: true, maxSize: 1000000 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: name === 'reading_preferences' ? ['CREATE UNIQUE INDEX idx_clearframe_preferences_owner ON reading_preferences (owner)'] : [],
    });
    app.save(collection);
  }
}, (app) => {
  for (const name of ['saved_analyses', 'reading_preferences']) {
    const collection = app.findCollectionByNameOrId(name);
    app.delete(collection);
  }
});
