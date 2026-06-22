const url = process.env.DB_URL;

// sequelize-cli drops the URL's `?ssl=true` query param, so TLS must be set
// explicitly here — but only when the URL actually requests it, so the local
// (non-TLS) Postgres in docker-compose is left untouched.
const useSsl = !!url && /[?&]ssl=true/i.test(url);

const common = url
  ? {
      url,
      dialect: 'postgres',
      seederStorage: 'sequelize',
      ...(useSsl && {
        dialectOptions: { ssl: { require: true, rejectUnauthorized: true } },
      }),
    }
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
