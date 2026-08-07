const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert');

const db = require('../models');
const { resetGameTables, closeDb } = require('./helpers/db');

beforeEach(resetGameTables);
after(closeDb);

// Mixed case on purpose: the stored value keeps whatever casing was typed, while
// uniqueness and lookups ignore it.
const USERNAME = 'Test_User';

test('a user round-trips', async () => {
  await db.User.create({ username: USERNAME, password_hash: 'not-a-real-hash' });

  const found = await db.User.findOne({ where: { username: USERNAME } });

  assert.strictEqual(found.username, USERNAME);
});

test('the default scope never returns the password hash', async () => {
  await db.User.create({ username: USERNAME, password_hash: 'not-a-real-hash' });

  const found = await db.User.findOne({ where: { username: USERNAME } });

  assert.strictEqual(found.password_hash, undefined);
  assert.strictEqual(found.toJSON().password_hash, undefined);
});

test('the withPassword scope returns the hash for login to check', async () => {
  await db.User.create({ username: USERNAME, password_hash: 'not-a-real-hash' });

  const found = await db.User.scope('withPassword').findOne({ where: { username: USERNAME } });

  assert.strictEqual(found.password_hash, 'not-a-real-hash');
});

test('usernames are unique regardless of case', async () => {
  await db.User.create({ username: USERNAME, password_hash: 'x' });

  await assert.rejects(
    () => db.User.create({ username: USERNAME.toLowerCase(), password_hash: 'y' }),
    // Asserting the constraint NAME, not just that something was rejected. The
    // name lives on error.parent.constraint — error.message is only the generic
    // 'Validation error', so matching on it would silently never fire.
    (error) => error.parent.constraint === 'users_username_lower_unique'
  );
});

// The negative control for the test above. Without this, the suite would pass
// just as green against an over-broad index — `fn('lower', 'username')` with a
// string literal instead of col() is a one-character typo Postgres accepts, and it
// would permit only ONE row in the whole table. Every other test here inserts a
// single user, so nothing else would notice.
test('two different usernames can coexist', async () => {
  await db.User.create({ username: USERNAME, password_hash: 'x' });
  await db.User.create({ username: 'test_user_b', password_hash: 'y' });

  assert.strictEqual(await db.User.count(), 2);
});

test('an instance can never be serialized with its password hash', async () => {
  const created = await db.User.create({ username: USERNAME, password_hash: 'secret-hash' });

  // create() returns a populated instance regardless of defaultScope, so this is
  // the path a register route would leak through: res.json(user).
  assert.strictEqual(created.toJSON().password_hash, undefined);
  assert.strictEqual(JSON.stringify(created).includes('secret-hash'), false);

  // ...while login can still read the hash off a withPassword instance.
  const forLogin = await db.User.scope('withPassword').findOne({ where: { username: USERNAME } });
  assert.strictEqual(forLogin.password_hash, 'secret-hash');
});

test('a case-insensitive lookup finds a differently-cased username', async () => {
  await db.User.create({ username: USERNAME, password_hash: 'x' });

  const found = await db.User.findOne({
    where: db.sequelize.where(
      db.sequelize.fn('lower', db.sequelize.col('username')),
      USERNAME.toLowerCase()
    ),
  });

  assert.strictEqual(found.username, USERNAME);
});
