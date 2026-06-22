const common = process.env.DB_URL
  ? { url: process.env.DB_URL, dialect: 'postgres', seederStorage: 'sequelize' }
  : {
      username: process.env.DB_USER || 'bsluser',
      password: process.env.DB_PASSWORD || 'bslpassword',
      database: process.env.DB_NAME || 'bsldb',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      dialect: 'postgres',
      seederStorage: 'sequelize',
    };

module.exports = {
  development: { ...common },
  test: { ...common, database: process.env.DB_NAME_TEST || 'bsldb_test' },
  production: { ...common },
};
