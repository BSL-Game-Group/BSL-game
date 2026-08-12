const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const bcrypt = require('bcryptjs');

const app = require('../app');
const db = require('../models');
const { verifyToken } = require('../utils/token');
const { resetGameTables, closeDb } = require('./helpers/db');

beforeEach(resetGameTables);
after(closeDb);

const USERNAME = 'Test_User';
const PASSWORD = 'test-password-123';

const register = (body) => request(app).post('/api/auth/register').send(body);

test('registering returns a usable token and the new user', async () => {
  const response = await register({ username: USERNAME, password: PASSWORD });

  assert.strictEqual(response.status, 201);
  assert.strictEqual(response.body.user.username, USERNAME);
  assert.ok(response.body.user.id);
  assert.strictEqual(verifyToken(response.body.token).sub, response.body.user.id);
});

test('the password is stored only as a bcrypt hash', async () => {
  await register({ username: USERNAME, password: PASSWORD });

  const user = await db.User.scope('withPassword').findOne();

  assert.notStrictEqual(user.password_hash, PASSWORD);
  assert.ok(await bcrypt.compare(PASSWORD, user.password_hash));
});

test('the response never leaks the hash', async () => {
  const response = await register({ username: USERNAME, password: PASSWORD });

  // Assert success FIRST: without it this whole test passes vacuously against a
  // 404, whose empty body trivially contains none of the strings below.
  assert.strictEqual(response.status, 201);
  assert.ok(response.body.user, 'a user should have been returned to inspect');

  const body = JSON.stringify(response.body);
  assert.strictEqual(body.includes('password'), false);
  assert.strictEqual(body.includes(PASSWORD), false);
  assert.strictEqual(body.includes('$2'), false); // a bcrypt hash prefix
});

test('a taken username is a 409, case-insensitively', async () => {
  await register({ username: USERNAME, password: PASSWORD });

  const response = await register({
    username: USERNAME.toLowerCase(),
    password: 'a-different-password',
  });

  assert.strictEqual(response.status, 409);
  assert.strictEqual(response.body.code, 'username_taken');
  assert.strictEqual(await db.User.count(), 1);
});

test('username validation boundaries', async () => {
  const cases = ['ab', 'a'.repeat(33), 'has space', 'has!punctuation', '', null, 42, undefined];

  for (const username of cases) {
    const response = await register({ username, password: PASSWORD });

    assert.strictEqual(response.status, 400, `expected 400 for ${JSON.stringify(username)}`);
    assert.strictEqual(response.body.code, 'username_invalid');
  }

  assert.strictEqual(await db.User.count(), 0);
});

test('the shortest allowed username and password are accepted', async () => {
  const response = await register({ username: 'abc', password: '12345678' });

  assert.strictEqual(response.status, 201);
});

test('a password under 8 characters is a 400', async () => {
  const response = await register({ username: USERNAME, password: '1234567' });

  assert.strictEqual(response.status, 400);
  assert.strictEqual(response.body.code, 'password_too_short');
  assert.strictEqual(await db.User.count(), 0);
});

test('an entirely missing body is a 400, not a crash', async () => {
  const response = await request(app).post('/api/auth/register');

  assert.strictEqual(response.status, 400);
  assert.strictEqual(response.body.code, 'username_invalid');
});

test('registering claims the rounds played as a guest on this browser', async () => {
  await db.Round.create({ session_id: 'session-a', score: 4, correct_count: 4, answer_count: 5 });
  await db.Round.create({ session_id: 'session-a', score: 2, correct_count: 2, answer_count: 5 });

  const response = await register({
    username: USERNAME,
    password: PASSWORD,
    session_id: 'session-a',
  });

  assert.strictEqual(response.body.claimed_rounds, 2);
  assert.strictEqual(await db.Round.count({ where: { user_id: response.body.user.id } }), 2);
});

test('registering without a session_id claims nothing and says so', async () => {
  const response = await register({ username: USERNAME, password: PASSWORD });

  assert.strictEqual(response.body.claimed_rounds, 0);
});
