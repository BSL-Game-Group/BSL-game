const { test } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');

const app = require('../app');

test('the exported app serves the root route without a listener', async () => {
  const response = await request(app).get('/');

  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.text, 'Backend is running');
});

test('an unknown route is a 404', async () => {
  const response = await request(app).get('/definitely-not-a-route');

  assert.strictEqual(response.status, 404);
});
