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
