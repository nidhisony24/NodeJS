
exports.up = function(db, Promise) {
    return db.schema.createTable('user_activation_codes', t => {
     t.increments('id');
     t.bigInteger('user_id');
     t.string('code', 2048);
   });
};

exports.down = function(db, Promise) {
    return db.schema.dropTable('user_activation_codes');
};
