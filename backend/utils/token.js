const jwt = require('jsonwebtoken')

const TEST_SECRET = 'bsl-game-test-secret'
const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60

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
