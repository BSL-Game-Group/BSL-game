const { Sequelize, DataTypes } = require('sequelize');
const configByEnv = require('../config/config');

const env = process.env.NODE_ENV || 'development';
const config = configByEnv[env];

const sequelize = process.env.DB_URL
  ? new Sequelize(process.env.DB_URL, { logging: false })
  : new Sequelize(config.database, config.username, config.password, {
      host: config.host,
      port: config.port,
      dialect: config.dialect,
      logging: false,
    });

const BSLClass = require('./bslclass')(sequelize, DataTypes);
const Microbe = require('./microbe')(sequelize, DataTypes);
const RoomEntry = require('./roomentry')(sequelize, DataTypes);

// A microbe belongs to one BSL class; a class has many microbes.
Microbe.belongsTo(BSLClass, { foreignKey: 'bsl_level', targetKey: 'class_number', as: 'bsl_class' });
BSLClass.hasMany(Microbe, { foreignKey: 'bsl_level', sourceKey: 'class_number', as: 'microbes' });

const db = { sequelize, Sequelize, BSLClass, Microbe, RoomEntry };

module.exports = db;
