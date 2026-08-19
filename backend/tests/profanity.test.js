const test = require('node:test');
const assert = require('node:assert');
const auth = require('../routes/auth');

const validateCredentials = auth.validateCredentials;

test('username check allows clean usernames', () => {
  const result = validateCredentials('FriendlyPlayer', 'securePassword123');
  assert.strictEqual(result, null); // null means validation passed successfully
});

test('username check blocks profanity', () => {
  const result = validateCredentials('bad_perkele', 'securePassword123');
  assert.notStrictEqual(result, null);
  assert.strictEqual(result.status, 400);
  assert.strictEqual(result.body.code, 'username_not_allowed');
});

test('username check handles case-insensitivity or edge cases', () => {
  const result = validateCredentials('PERKELE', 'securePassword123');
  assert.notStrictEqual(result, null);
  assert.strictEqual(result.status, 400);
  assert.strictEqual(result.body.code, 'username_not_allowed');
});