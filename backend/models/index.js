const { Sequelize, DataTypes } = require('sequelize');
const configByEnv = require('../config/config');

const env = process.env.NODE_ENV || 'development';
const config = configByEnv[env];

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: false,
  }
);

const BSLClass = require('./bslclass')(sequelize, DataTypes);

const db = { sequelize, Sequelize, BSLClass };

module.exports = db;
