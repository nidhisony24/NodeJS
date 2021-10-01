require("dotenv").config();

module.exports = {
  development: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD || null,
    database: process.env.DATABASE_NAME,
    host: process.env.DB_HOST,
    dialect: process.env.DIALECT,
    logging: false,
  },
};
