const { test } = require('node:test');
const assert = require('node:assert');
const express = require('express');
const request = require('supertest');

const app = require('../app');
const db = require('../models');
const { errorHandler } = require('../middleware/errorHandler');

// No database is needed here: the only route these tests reach fails before it
// queries, and a malformed body never reaches a route at all. Following
// app.test.js, there is nothing to close.

const VALID_CREDENTIALS = { username: 'Test_User', password: 'test-password-123' };

// Shaped like a real Sequelize connection failure, because the point of these
// tests is what the client is told about one. Express's default handler answers
// with an HTML page containing the stack whenever NODE_ENV !== 'production', and
// NODE_ENV is set nowhere in this repo (see utils/token.js) — so on OpenShift it
// would hand this whole string, the database address included, to any client.
const DB_FAILURE = 'SequelizeConnectionRefusedError: connect ECONNREFUSED 10.0.0.5:5432';

// register() calls db.User.findOne first, so failing it exercises the async
// rejection path of a real shipped route rather than a purpose-built probe.
function breakTheDatabase(t) {
  t.mock.method(db.User, 'findOne', () => {
    throw new Error(DB_FAILURE);
  });
}

// Keeps the deliberate failures out of the suite's output, and lets the last test
// assert that they are still logged rather than swallowed.
function silenceServerLog(t) {
  return t.mock.method(console, 'error', () => {});
}

test('an unexpected failure answers with JSON, not an HTML error page', async (t) => {
  breakTheDatabase(t);
  silenceServerLog(t);

  const response = await request(app).post('/api/auth/register').send(VALID_CREDENTIALS);

  assert.strictEqual(response.status, 500);
  assert.match(response.headers['content-type'], /application\/json/);
  assert.strictEqual(response.body.code, 'internal_error');
});

test('the response carries no stack, no file paths and no database address', async (t) => {
  breakTheDatabase(t);
  silenceServerLog(t);

  const response = await request(app).post('/api/auth/register').send(VALID_CREDENTIALS);

  // Asserting on the raw text, not the parsed body: the leak this guards against
  // was an HTML document, which parses to an empty body and would pass vacuously.
  for (const leak of ['ECONNREFUSED', '10.0.0.5:5432', 'Sequelize', '/backend/', '.js:', ' at ']) {
    assert.strictEqual(
      response.text.includes(leak),
      false,
      `the response leaked ${JSON.stringify(leak)}: ${response.text.slice(0, 200)}`
    );
  }
});

// express.json() rejects a broken body with a 400 that reached the same default
// handler, so it leaked in exactly the same way.
test('a malformed JSON body is a JSON 400, not an HTML error page', async (t) => {
  silenceServerLog(t);

  const response = await request(app)
    .post('/api/auth/login')
    .set('Content-Type', 'application/json')
    .send('{"username": "Test_User", "password":');

  assert.strictEqual(response.status, 400);
  assert.match(response.headers['content-type'], /application\/json/);
  assert.strictEqual(response.body.code, 'bad_request');
  assert.strictEqual(response.text.includes('.js:'), false);
});

// Hiding the error from the client must not hide it from us — a 500 nobody can
// diagnose is worse than the leak.
test('the failure is still logged server-side', async (t) => {
  breakTheDatabase(t);
  const log = silenceServerLog(t);

  await request(app).post('/api/auth/register').send(VALID_CREDENTIALS);

  assert.strictEqual(log.mock.callCount(), 1);
  assert.match(String(log.mock.calls[0].arguments[0]), /ECONNREFUSED/);
});

// The one branch no route in this app can reach, so it needs a purpose-built one:
// a handler that has already started writing when it fails. Sending a second set
// of headers would throw ERR_HTTP_HEADERS_SENT inside the error handler itself and
// turn a partial response into a hung one, so it must hand back to Express.
test('an error after the response has started is handed back, not answered twice', async (t) => {
  silenceServerLog(t);

  const probe = express();
  probe.get('/half-sent', (req, res) => {
    res.write('already on the wire');
    throw new Error('failed after the first byte');
  });
  probe.use(errorHandler);

  // Handing back to Express makes it destroy the socket, which the client sees as
  // a reset connection. That is the observable proof: had the handler tried to
  // answer anyway, this would resolve with a body instead of rejecting.
  await assert.rejects(
    () => request(probe).get('/half-sent'),
    (error) => error.code === 'ECONNRESET'
  );
});
