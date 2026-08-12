const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');

const app = require('../app');
const { resetGameTables, closeDb } = require('./helpers/db');

beforeEach(resetGameTables);
after(closeDb);

const USERNAME = 'Test_User';
const PASSWORD = 'test-password-123';

function failedLogin(username) {
  return request(app).post('/api/auth/login').send({ username, password: 'wrongwrongwrong' });
}

test('the eleventh failed login for a username is rejected', async () => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const response = await failedLogin('victim');
    assert.strictEqual(response.status, 401, `attempt ${attempt + 1} should still be allowed`);
  }

  const blocked = await failedLogin('victim');

  assert.strictEqual(blocked.status, 429);
  assert.strictEqual(blocked.body.code, 'rate_limited');
});

test('one hammered username does not lock out everybody else', async () => {
  for (let attempt = 0; attempt < 11; attempt += 1) {
    await failedLogin('victim');
  }

  const other = await failedLogin('bystander');

  assert.strictEqual(other.status, 401);
});

test('the limit is case-insensitive, like the username itself', async () => {
  for (let attempt = 0; attempt < 11; attempt += 1) {
    await failedLogin('victim');
  }

  const sameUserDifferentCase = await failedLogin('VICTIM');

  assert.strictEqual(sameUserDifferentCase.status, 429);
});

test('a successful login does not spend the budget', async () => {
  await request(app).post('/api/auth/register').send({ username: USERNAME, password: PASSWORD });

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: USERNAME, password: PASSWORD });

    assert.strictEqual(response.status, 200, `attempt ${attempt + 1} should succeed`);
  }
});

function register(username) {
  return request(app).post('/api/auth/register').send({ username, password: PASSWORD });
}

// The two routes must not share one bucket. While they did, the budget was
// spendable by anyone: a stranger filled it with taken-username 409s, which are
// not 2xx and so are not skipped, and the account's real owner was then answered
// 429 on a login they had never attempted. Unauthenticated denial of service
// against one named account, no password required, and GET /api/leaderboard
// hands out the names to aim at.
test('failed registrations do not lock the username out of logging in', async () => {
  await register('squatted');

  for (let attempt = 0; attempt < 11; attempt += 1) {
    await register('squatted');
  }

  const login = await request(app)
    .post('/api/auth/login')
    .send({ username: 'squatted', password: PASSWORD });

  assert.strictEqual(login.status, 200);
});

// The same confusion in the other direction: hammering login for a name nobody
// has taken yet must not stop the person who wants it from signing up.
test('failed logins do not lock the username out of registering', async () => {
  for (let attempt = 0; attempt < 11; attempt += 1) {
    await failedLogin('newcomer');
  }

  const registered = await register('newcomer');

  assert.strictEqual(registered.status, 201);
});

// Splitting the buckets must not amount to dropping the register one.
test('the eleventh failed registration for a username is rejected', async () => {
  await register('taken_name');

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const response = await register('taken_name');

    assert.strictEqual(response.status, 409, `attempt ${attempt + 1} should still be allowed`);
  }

  const blocked = await register('taken_name');

  assert.strictEqual(blocked.status, 429);
  assert.strictEqual(blocked.body.code, 'rate_limited');
});
