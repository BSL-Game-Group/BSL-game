const parseDbUrl = (url) => {
  const u = new URL(url);
  return {
    username: u.username,
    password: u.password,
    database: u.pathname.slice(1),
    host: u.hostname,
    port: Number(u.port) || 5432,
    dialect: 'postgres',
  };
};

const common = process.env.DB_URL
  ? parseDbUrl(process.env.DB_URL)
  : {
      username: process.env.DB_USER || 'bsluser',
      password: process.env.DB_PASSWORD || 'bslpassword',
      database: process.env.DB_NAME || 'bsldb',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      dialect: 'postgres',
    };

module.exports = {
  development: { ...common },
  test: { ...common, database: process.env.DB_NAME_TEST || 'bsldb_test' },
  production: { ...common },
};
