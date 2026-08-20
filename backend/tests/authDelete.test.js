const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');

const app = require('../app');
const db = require('../models');
const { resetGameTables, closeDb } = require('./helpers/db');

beforeEach(resetGameTables);
after(closeDb);

const USERNAME = 'Test_User';
const PASSWORD = 'test-password-123';

async function registerTestUser(username = USERNAME) {
  const response = await request(app)
    .post('/api/auth/register')
    .send({ username, password: PASSWORD });

  return response.body;
}

test('DELETE /api/auth/me deletes the authenticated user', async () => {
  const registered = await registerTestUser('deleteme');

  const deleteRes = await request(app)
    .delete('/api/auth/me')
    .set('Authorization', `Bearer ${registered.token}`);

  // Adjust status expectation to match your API design (e.g., 200 or 204)
  assert.strictEqual(deleteRes.status, 204);

  // Verify token / user no longer works
  const checkRes = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${registered.token}`);

  assert.strictEqual(checkRes.status, 401);
});

test('DELETE /api/auth/me rejects unauthenticated requests', async () => {
  const res = await request(app).delete('/api/auth/me');
  assert.strictEqual(res.status, 401);
});