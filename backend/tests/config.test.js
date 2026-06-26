const { test } = require('node:test');
const assert = require('node:assert');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', 'config', 'config.js');

const DB_ENV_KEYS = [
  'DB_URL',
  'DB_HOST',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'DB_PORT',
  'DB_NAME_TEST',
];

// config.js reads process.env at require time, so reset the relevant keys and
// bust the module cache for each scenario.
function loadConfig(env = {}) {
  for (const k of DB_ENV_KEYS) {
    delete process.env[k];
  }

  Object.assign(process.env, env);

  delete require.cache[require.resolve(CONFIG_PATH)];

  return require(CONFIG_PATH);
}

test('enables TLS with cert verification when DB_URL requests ssl=true', () => {
  const cfg = loadConfig({
    DB_URL:
      'postgresql://u:p@possu-test.it.helsinki.fi:5432/db?targetServerType=primary&ssl=true',
  });

  assert.deepStrictEqual(cfg.development.dialectOptions, {
    ssl: {
      require: true,
      rejectUnauthorized: true,
    },
  });
});

test('does NOT force TLS for a DB_URL without ssl=true (local compose)', () => {
  const cfg = loadConfig({
    DB_URL: 'postgresql://bsluser:bslpassword@postgres:5432/bsldb',
  });

  assert.strictEqual(cfg.development.dialectOptions, undefined);
});

test('does NOT force TLS when DB_URL explicitly sets ssl=false', () => {
  const cfg = loadConfig({
    DB_URL: 'postgresql://u:p@host:5432/db?ssl=false',
  });

  assert.strictEqual(cfg.development.dialectOptions, undefined);
});

test('falls back to localhost defaults when DB_URL is unset', () => {
  const cfg = loadConfig({});

  assert.strictEqual(cfg.development.host, 'localhost');
  assert.strictEqual(cfg.development.username, 'bsluser');
  assert.strictEqual(cfg.development.dialectOptions, undefined);
});

test('seeder tracking is enabled in every environment', () => {
  const cfg = loadConfig({
    DB_URL: 'postgresql://u:p@h:5432/db?ssl=true',
  });

  for (const env of ['development', 'test', 'production']) {
    assert.strictEqual(
      cfg[env].seederStorage,
      'sequelize',
      `${env} should track seeders`
    );
  }
});