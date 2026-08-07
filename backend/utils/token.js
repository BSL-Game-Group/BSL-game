const jwt = require('jsonwebtoken')

const TEST_SECRET = 'bsl-game-test-secret'
const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60

// Resolved at require time, so an image with no secret fails to start instead of
// booting and signing every token with a constant.
//
// There is deliberately NO fallback outside the test suite. A default living in
// this repository is a published private key: anyone who can read the repo could
// forge a token for any account. NODE_ENV=test is the single exception, so the
// backend suite runs unconfigured; every other value — including unset — throws.
//
// This is stricter than the original design, which fell back unless
// NODE_ENV === 'production'. That guard would never have fired: NODE_ENV is set
// nowhere in this repo (not in backend/Dockerfile, docker-compose.yaml, or
// backend/manifests/deployment.yaml) and Node does not default it, so a missing
// secret would silently have become the repo-published constant.
//
// Local play is unaffected: docker-compose.yaml supplies JWT_SECRET. Running
// `npm start` directly needs it in the environment, by design.
function resolveSecret() {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET
  }

  if (process.env.NODE_ENV === 'test') {
    return TEST_SECRET
  }

  throw new Error('JWT_SECRET must be set (no default exists outside NODE_ENV=test)')
}

const secret = resolveSecret()

function signToken(user, options = {}) {
  return jwt.sign(
    { sub: user.id, username: user.username },
    secret,
    { expiresIn: options.expiresIn ?? TOKEN_TTL_SECONDS }
  )
}

function verifyToken(token) {
  if (typeof token !== 'string' || token.length === 0) {
    return null
  }

  try {
    return jwt.verify(token, secret)
  } catch {
    // Expired, tampered with, or signed by someone else — all mean "not signed in".
    return null
  }
}

module.exports = { signToken, verifyToken, TOKEN_TTL_SECONDS }
