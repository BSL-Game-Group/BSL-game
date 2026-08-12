const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');

const app = require('../app');
const db = require('../models');
const { resetGameTables, closeDb } = require('./helpers/db');

beforeEach(resetGameTables);
after(closeDb);

const PASSWORD = 'test-password-123';

async function userWithRounds(username, scores) {
  const user = await db.User.create({ username, password_hash: 'x' });

  for (const score of scores) {
    await db.Round.create({
      user_id: user.id,
      session_id: `session-${username}`,
      score,
      correct_count: score,
      answer_count: 15,
    });
  }

  return user;
}

test('lists each user once, by their best round', async () => {
  await userWithRounds('Test_User', [3, 11, 7]);
  await userWithRounds('test_user_b', [9]);

  const response = await request(app).get('/api/leaderboard');

  assert.strictEqual(response.status, 200);
  assert.deepStrictEqual(response.body.map((row) => [row.username, row.score]), [
    ['Test_User', 11],
    ['test_user_b', 9],
  ]);
});

test('excludes unclaimed guest rounds', async () => {
  await userWithRounds('Test_User', [2]);
  await db.Round.create({
    session_id: 'session-guest',
    score: 99,
    correct_count: 99,
    answer_count: 15,
  });

  const response = await request(app).get('/api/leaderboard');

  assert.strictEqual(response.body.length, 1);
  assert.strictEqual(response.body[0].username, 'Test_User');
});

test('a claimed round joins the board', async () => {
  await request(app)
    .post('/api/auth/register')
    .send({ username: 'Test_User', password: PASSWORD });
  await db.Round.create({
    session_id: 'session-a',
    score: 6,
    correct_count: 6,
    answer_count: 15,
  });

  const before = await request(app).get('/api/leaderboard');
  await request(app)
    .post('/api/auth/login')
    .send({ username: 'Test_User', password: PASSWORD, session_id: 'session-a' });
  const after = await request(app).get('/api/leaderboard');

  assert.deepStrictEqual(before.body, []);
  assert.deepStrictEqual(after.body.map((row) => [row.username, row.score]), [['Test_User', 6]]);
});

test('an earlier round wins a tie', async () => {
  const early = await db.User.create({ username: 'Early', password_hash: 'x' });
  const late = await db.User.create({ username: 'Late', password_hash: 'x' });
  await db.Round.create({
    user_id: late.id, session_id: 's', score: 5, correct_count: 5, answer_count: 15,
    createdAt: new Date('2026-05-01'),
  });
  await db.Round.create({
    user_id: early.id, session_id: 's', score: 5, correct_count: 5, answer_count: 15,
    createdAt: new Date('2026-01-01'),
  });

  const response = await request(app).get('/api/leaderboard');

  assert.deepStrictEqual(response.body.map((row) => row.username), ['Early', 'Late']);
});

test('shows at most 20 players', async () => {
  for (let index = 0; index < 25; index += 1) {
    await userWithRounds(`player${index}`, [index]);
  }

  const response = await request(app).get('/api/leaderboard');

  assert.strictEqual(response.body.length, 20);
  assert.strictEqual(response.body[0].score, 24);
});

test('an empty board is an empty array', async () => {
  const response = await request(app).get('/api/leaderboard');

  assert.deepStrictEqual(response.body, []);
});
