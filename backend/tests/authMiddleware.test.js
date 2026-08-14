const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert');
const express = require('express');
const request = require('supertest');

const db = require('../models');
const { signToken } = require('../utils/token');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { resetGameTables, closeDb } = require('./helpers/db');

beforeEach(resetGameTables);
after(closeDb);

const USERNAME = 'Test_User';

// A throwaway app: the middleware is what is under test, not any real route.
function buildProbeApp() {
  const app = express();

  app.get('/required', requireAuth, (req, res) => res.json({ username: req.user.username }));
  app.get('/optional', optionalAuth, (req, res) =>
    res.json({ username: req.user ? req.user.username : null })
  );

  return app;
}

test('requireAuth accepts a valid bearer token', async () => {
  const user = await db.User.create({ username: USERNAME, password_hash: 'x' });
  const token = signToken(user);

  const response = await request(buildProbeApp())
    .get('/required')
    .set('Authorization', `Bearer ${token}`);

  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.body.username, USERNAME);
});

test('requireAuth rejects a missing, malformed or expired token the same way', async () => {
  const user = await db.User.create({ username: USERNAME, password_hash: 'x' });
  const app = buildProbeApp();

  const missing = await request(app).get('/required');
  const malformed = await request(app).get('/required').set('Authorization', 'Bearer nonsense');
  const wrongScheme = await request(app)
    .get('/required')
    .set('Authorization', `Token ${signToken(user)}`);
  const noToken = await request(app).get('/required').set('Authorization', 'Bearer');
  const expired = await request(app)
    .get('/required')
    .set('Authorization', `Bearer ${signToken(user, { expiresIn: -10 })}`);

  for (const response of [missing, malformed, wrongScheme, noToken, expired]) {
    assert.strictEqual(response.status, 401);
    assert.strictEqual(response.body.code, 'unauthenticated');
  }
});

test('requireAuth rejects a token for a user who no longer exists', async () => {
  const token = signToken({ id: 9999, username: 'ghost_user' });

  const response = await request(buildProbeApp())
    .get('/required')
    .set('Authorization', `Bearer ${token}`);

  assert.strictEqual(response.status, 401);
});

test('requireAuth never exposes the password hash on req.user', async () => {
  const user = await db.User.create({ username: USERNAME, password_hash: 'secret-hash' });

  const app = express();
  app.get('/whoami', requireAuth, (req, res) => res.json(req.user));

  const response = await request(app)
    .get('/whoami')
    .set('Authorization', `Bearer ${signToken(user)}`);

  assert.strictEqual(response.body.password_hash, undefined);
  assert.strictEqual(JSON.stringify(response.body).includes('secret-hash'), false);
});

test('optionalAuth lets an anonymous request through', async () => {
  const response = await request(buildProbeApp()).get('/optional');

  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.body.username, null);
});

test('optionalAuth identifies a signed-in request', async () => {
  const user = await db.User.create({ username: USERNAME, password_hash: 'x' });

  const response = await request(buildProbeApp())
    .get('/optional')
    .set('Authorization', `Bearer ${signToken(user)}`);

  assert.strictEqual(response.body.username, USERNAME);
});

test('optionalAuth ignores a bad token rather than failing the request', async () => {
  const response = await request(buildProbeApp())
    .get('/optional')
    .set('Authorization', 'Bearer nonsense');

  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.body.username, null);
});
