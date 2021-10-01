require("dotenv").config();
var environment = process.env.NODE_ENV || 'development';
var config = require('./knexfile.js')[environment];
const db  = require('knex')(config);

db.raw("SELECT VERSION()").then(
    (version) => console.log((version[0][0]))
).catch((err) => { console.log( err); throw err; })
    .finally(() => {
        db.destroy();
    });

module.exports = db;