const { test, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');

const app = require('../app');
const db = require('../models');

after(async () => {
  await db.sequelize.close();
});

test('the suite is pointed at the test database, not the dev one', () => {
  assert.strictEqual(db.sequelize.config.database, 'bsldb_test');
});

test('the seeded BSL classes are readable over HTTP', async () => {
  const response = await request(app).get('/api/bsl-classes');

  assert.strictEqual(response.status, 200);
  assert.deepStrictEqual(
    response.body.map((row) => row.class_number),
    [1, 2, 3, 4]
  );
});
