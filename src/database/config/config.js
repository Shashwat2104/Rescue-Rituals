'use strict';

require('dotenv').config();

/**
 * Sequelize CLI configuration.
 * Reads DB credentials from environment variables (same .env used by the Nest app).
 */
module.exports = {
  development: {
    dialect: 'postgres',
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    database: process.env.DATABASE_NAME,
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    logging: process.env.DATABASE_LOGGING === 'true' ? console.log : false,
  },
  test: {
    dialect: 'postgres',
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    database: process.env.DATABASE_NAME_TEST,
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    logging: false,
  },
  production: {
    dialect: 'postgres',
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT) || 5432,
    database: process.env.DATABASE_NAME,
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    logging: false,
  },
};
