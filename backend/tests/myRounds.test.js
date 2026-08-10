const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');

const app = require('../app');
const db = require('../models');
const { resetGameTables, closeDb } = require('./helpers/db');

beforeEach(resetGameTables);
after(closeDb);

const PASSWORD = 'test-password-123';

async function register(username) {
  const response = await request(app)
    .post('/api/auth/register')
    .send({ username, password: PASSWORD });
  return response.body;
}

function round(attributes) {
  return db.Round.create({
    session_id: 'session-a',
    score: 1,
    correct_count: 1,
    answer_count: 5,
    ...attributes,
  });
}

test('returns only the caller rounds, newest first', async () => {
  const owner = await register('Test_User');
  const other = await register('test_user_b');
  await round({ user_id: owner.user.id, score: 1, createdAt: new Date('2026-01-01') });
  await round({ user_id: owner.user.id, score: 5, createdAt: new Date('2026-03-01') });
  await round({ user_id: other.user.id, score: 9 });
  await round({ user_id: null, score: 7 });

  const response = await request(app)
    .get('/api/me/rounds')
    .set('Authorization', `Bearer ${owner.token}`);

  assert.strictEqual(response.status, 200);
  assert.deepStrictEqual(response.body.map((row) => row.score), [5, 1]);
  assert.deepStrictEqual(Object.keys(response.body[0]).sort(), [
    'answer_count', 'correct_count', 'createdAt', 'id', 'score',
  ]);
});

test('a player with no rounds gets an empty list, not an error', async () => {
  const owner = await register('Test_User');

  const response = await request(app)
    .get('/api/me/rounds')
    .set('Authorization', `Bearer ${owner.token}`);

  assert.deepStrictEqual(response.body, []);
});

test('caps the history at 50 rounds', async () => {
  const owner = await register('Test_User');
  for (let index = 0; index < 55; index += 1) {
    await round({ user_id: owner.user.id, score: index });
  }

  const response = await request(app)
    .get('/api/me/rounds')
    .set('Authorization', `Bearer ${owner.token}`);

  assert.strictEqual(response.body.length, 50);
});

test('requires a token', async () => {
  const response = await request(app).get('/api/me/rounds');

  assert.strictEqual(response.status, 401);
});
