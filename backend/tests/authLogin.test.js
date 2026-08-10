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

const login = (body) => request(app).post('/api/auth/login').send(body);

async function registerTestUser(username = USERNAME, sessionId) {
  const response = await request(app)
    .post('/api/auth/register')
    .send({ username, password: PASSWORD, session_id: sessionId });

  return response.body;
}

function guestRound(sessionId, score = 3) {
  return db.Round.create({
    session_id: sessionId,
    score,
    correct_count: score,
    answer_count: 5,
  });
}

test('correct credentials return a token', async () => {
  await registerTestUser();

  const response = await login({ username: USERNAME, password: PASSWORD });

  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.body.user.username, USERNAME);
  assert.ok(response.body.token);
});

test('the username is case-insensitive at login', async () => {
  await registerTestUser();

  const response = await login({ username: USERNAME.toUpperCase(), password: PASSWORD });

  assert.strictEqual(response.status, 200);
  // The stored casing comes back, not what was typed at the prompt.
  assert.strictEqual(response.body.user.username, USERNAME);
});

test('a wrong password and an unknown username are indistinguishable', async () => {
  await registerTestUser();

  const wrongPassword = await login({ username: USERNAME, password: 'wrong-password-here' });
  const unknownUser = await login({ username: 'nobody_at_all', password: PASSWORD });

  assert.strictEqual(wrongPassword.status, 401);
  assert.strictEqual(unknownUser.status, 401);
  assert.deepStrictEqual(wrongPassword.body, unknownUser.body);
  assert.strictEqual(wrongPassword.body.code, 'invalid_credentials');
});

// The identical response body is only half of "does not reveal who has an
// account". Skipping bcrypt.compare for an unknown username answered in ~2ms
// against ~52ms for a wrong password — a 22x tell, measured. A lower bound is the
// robust way to assert this: bcrypt is CPU-bound, so a slower machine only makes
// the real timing longer, never shorter.
test('an unknown username costs the same work as a wrong password', async () => {
  await registerTestUser();

  const started = process.hrtime.bigint();
  const response = await login({ username: 'nobody_at_all', password: PASSWORD });
  const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6;

  assert.strictEqual(response.status, 401);
  assert.ok(
    elapsedMs > 10,
    `an unknown username returned in ${elapsedMs.toFixed(1)}ms — too fast to have hashed, so it leaks that the account does not exist`
  );
});

test('a malformed login body is a 401, not a crash', async () => {
  const empty = await login({});
  const missingBody = await request(app).post('/api/auth/login');
  const wrongTypes = await login({ username: 42, password: [] });

  for (const response of [empty, missingBody, wrongTypes]) {
    assert.strictEqual(response.status, 401);
    assert.strictEqual(response.body.code, 'invalid_credentials');
  }
});

test('the login response never leaks the hash', async () => {
  await registerTestUser();

  const response = await login({ username: USERNAME, password: PASSWORD });

  assert.strictEqual(response.status, 200);
  const body = JSON.stringify(response.body);
  assert.strictEqual(body.includes('password'), false);
  assert.strictEqual(body.includes('$2'), false);
});

test('logging in claims the guest rounds from this browser', async () => {
  const registered = await registerTestUser();
  await guestRound('session-a');

  const response = await login({ username: USERNAME, password: PASSWORD, session_id: 'session-a' });

  assert.strictEqual(response.body.claimed_rounds, 1);
  assert.strictEqual(await db.Round.count({ where: { user_id: registered.user.id } }), 1);
});

test('logging in again claims nothing the second time', async () => {
  await registerTestUser();
  await guestRound('session-a');

  await login({ username: USERNAME, password: PASSWORD, session_id: 'session-a' });
  const second = await login({ username: USERNAME, password: PASSWORD, session_id: 'session-a' });

  assert.strictEqual(second.body.claimed_rounds, 0);
});

test('a second player signing in cannot take a round the first already owns', async () => {
  const owner = await registerTestUser('owner_user');
  await guestRound('shared-session');
  await login({ username: 'owner_user', password: PASSWORD, session_id: 'shared-session' });

  // The thief registers on the same browser, so the same session_id is presented.
  const thief = await registerTestUser('thief_user', 'shared-session');

  assert.strictEqual(thief.claimed_rounds, 0);
  const round = await db.Round.findOne();
  assert.strictEqual(round.user_id, owner.user.id);
});

test('/api/auth/me identifies the token holder', async () => {
  const registered = await registerTestUser();

  const response = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${registered.token}`);

  assert.strictEqual(response.status, 200);
  assert.deepStrictEqual(response.body, { id: registered.user.id, username: USERNAME });
});

test('/api/auth/me is a 401 without a usable token', async () => {
  const missing = await request(app).get('/api/auth/me');
  const malformed = await request(app).get('/api/auth/me').set('Authorization', 'Bearer nope');
  const wrongScheme = await request(app).get('/api/auth/me').set('Authorization', 'Basic abc');

  for (const response of [missing, malformed, wrongScheme]) {
    assert.strictEqual(response.status, 401);
    assert.strictEqual(response.body.code, 'unauthenticated');
  }
});

test('a token still works after the password is changed underneath it', async () => {
  const registered = await registerTestUser();
  await db.User.update({ password_hash: 'a-different-hash' }, { where: { id: registered.user.id } });

  const response = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${registered.token}`);

  assert.strictEqual(response.status, 200);
});
