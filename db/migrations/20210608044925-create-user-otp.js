exports.up = function(db, Promise) {
  return db.schema.createTable('user_otps', t => {
    t.increments('id');
    t.bigInteger('user_id');
    t.string('otp');
    t.timestamp('created_at').defaultTo(db.fn.now());
    t.timestamp('updated_at').defaultTo(db.fn.now());
    t.unique(['otp']);

  });
};

exports.down = function(db, Promise) {
  return db.schema.dropTable('user_otps');
};