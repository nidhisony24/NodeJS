exports.up = function(db, Promise) {
  return db.schema.createTable('users', t => {
    t.increments('id');
    t.string('username');
    t.string('email');
    t.string('password');
    t.string('name');
    t.boolean('status');
    t.enum('role',['admin','member']);
    t.timestamp('created_at').defaultTo(db.fn.now());
    t.timestamp('updated_at').defaultTo(db.fn.now());
    t.unique(['email','username']);

  });
};

exports.down = function(db, Promise) {
  return db.schema.dropTable('users');
};