const { test } = require('node:test');
const assert = require('node:assert');
const express = require('express');
const request = require('supertest');

const app = require('../app');
const db = require('../models');
const { errorHandler } = require('../middleware/errorHandler');


const VALID_CREDENTIALS = { username: 'Test_User', password: 'test-password-123' };

const DB_FAILURE = 'SequelizeConnectionRefusedError: connect ECONNREFUSED 10.0.0.5:5432';

function breakTheDatabase(t) {
  t.mock.method(db.User, 'findOne', () => {
    throw new Error(DB_FAILURE);
  });
}

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

  for (const leak of ['ECONNREFUSED', '10.0.0.5:5432', 'Sequelize', '/backend/', '.js:', ' at ']) {
    assert.strictEqual(
      response.text.includes(leak),
      false,
      `the response leaked ${JSON.stringify(leak)}: ${response.text.slice(0, 200)}`
    );
  }
});

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

test('the failure is still logged server-side', async (t) => {
  breakTheDatabase(t);
  const log = silenceServerLog(t);

  await request(app).post('/api/auth/register').send(VALID_CREDENTIALS);

  assert.strictEqual(log.mock.callCount(), 1);
  assert.match(String(log.mock.calls[0].arguments[0]), /ECONNREFUSED/);
});

test('an error after the response has started is handed back, not answered twice', async (t) => {
  silenceServerLog(t);

  const probe = express();
  probe.get('/half-sent', (req, res) => {
    res.write('already on the wire');
    throw new Error('failed after the first byte');
  });
  probe.use(errorHandler);

  await assert.rejects(
    () => request(probe).get('/half-sent'),
    (error) => error.code === 'ECONNRESET'
  );
});
