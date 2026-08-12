const { test } = require('node:test');
const assert = require('node:assert');
const path = require('path');

const TOKEN_PATH = path.join(__dirname, '..', 'utils', 'token.js');

// token.js resolves the secret once at require time, so each scenario needs a
// fresh module instance — the same trick config.test.js uses.
function loadToken(env = {}) {
  delete process.env.JWT_SECRET;
  const previousNodeEnv = process.env.NODE_ENV;

  Object.assign(process.env, env);
  delete require.cache[require.resolve(TOKEN_PATH)];

  try {
    return require(TOKEN_PATH);
  } finally {
    process.env.NODE_ENV = previousNodeEnv;
  }
}

test('a signed token verifies back to the user it was signed for', () => {
  const { signToken, verifyToken } = loadToken({ JWT_SECRET: 'test-secret' });

  const payload = verifyToken(signToken({ id: 7, username: 'Test_User' }));

  assert.strictEqual(payload.sub, 7);
  assert.strictEqual(payload.username, 'Test_User');
});

test('garbage verifies to null instead of throwing', () => {
  const { verifyToken } = loadToken({ JWT_SECRET: 'test-secret' });

  assert.strictEqual(verifyToken('not-a-token'), null);
  assert.strictEqual(verifyToken(''), null);
  assert.strictEqual(verifyToken(undefined), null);
  assert.strictEqual(verifyToken(null), null);
});

test('a token signed with another secret is rejected', () => {
  const { signToken } = loadToken({ JWT_SECRET: 'secret-a' });
  const token = signToken({ id: 1, username: 'test_user_b' });

  const { verifyToken } = loadToken({ JWT_SECRET: 'secret-b' });

  assert.strictEqual(verifyToken(token), null);
});

test('an expired token is rejected', () => {
  const { signToken, verifyToken } = loadToken({ JWT_SECRET: 'test-secret' });

  const token = signToken({ id: 1, username: 'test_user_b' }, { expiresIn: -10 });

  assert.strictEqual(verifyToken(token), null);
});

test('every environment except the test suite refuses to load without JWT_SECRET', () => {
  // An unset NODE_ENV throws too: the only accepted value is the literal 'test'.
  for (const nodeEnv of ['production', 'development', 'staging']) {
    assert.throws(
      () => loadToken({ NODE_ENV: nodeEnv }),
      /JWT_SECRET/,
      `NODE_ENV=${nodeEnv} must refuse to start without a secret`
    );
  }
});

test('the test suite alone gets a fixed secret, so it runs unconfigured', () => {
  const { signToken, verifyToken } = loadToken({ NODE_ENV: 'test' });

  assert.strictEqual(verifyToken(signToken({ id: 3, username: 'test_user_c' })).sub, 3);
});

test('the token carries a 7-day expiry', () => {
  const { signToken, verifyToken } = loadToken({ JWT_SECRET: 'test-secret' });

  const payload = verifyToken(signToken({ id: 1, username: 'test_user_b' }));

  assert.strictEqual(payload.exp - payload.iat, 7 * 24 * 60 * 60);
});
