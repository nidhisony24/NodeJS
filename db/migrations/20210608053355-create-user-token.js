exports.up = function(db, Promise) {
  return db.schema.createTable('user_tokens', t => {
    t.increments('id');
    t.bigInteger('user_id');
    t.string('token', 2048);
    t.timestamp('created_at').defaultTo(db.fn.now());
    t.timestamp('updated_at').defaultTo(db.fn.now());
  });
};

exports.down = function(db, Promise) {
  return db.schema.dropTable('user_tokens');
};