const express = require('express')
const bcrypt = require('bcryptjs')

const db = require('../models')
const { signToken } = require('../utils/token')
const { requireAuth } = require('../middleware/auth')
const { authLimiter } = require('../middleware/rateLimit')
const { claimRoundsForSession } = require('../services/claim')

const router = express.Router()

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/
const USERNAME_MIN = 3
const USERNAME_MAX = 32
const PASSWORD_MIN = 8
const BCRYPT_COST = 10

// A real bcrypt hash of a throwaway string, compared against when no user is
// found so that login costs the same either way. Without it the endpoint is a
// user-enumeration oracle: skipping bcrypt.compare made an unknown username
// answer in ~2ms against ~52ms for a wrong password — a 22x tell, measured. The
// identical response body promised by the spec is not enough on its own, and the
// per-username rate limiter does not help, since enumeration needs only one
// request per candidate name.
//
// Not a secret: it authenticates nobody, and is a constant so that startup does
// not pay for a hash it will usually not need.
const NO_SUCH_USER_HASH = '$2b$10$btzb5aCHcPW4cdUS.QC3Ie5brTLRZ6MDVPNOlbPsjo38pShvM30xC'

function validateCredentials(username, password) {
  if (
    typeof username !== 'string' ||
    username.length < USERNAME_MIN ||
    username.length > USERNAME_MAX ||
    !USERNAME_PATTERN.test(username)
  ) {
    return {
      status: 400,
      body: {
        error: 'Username must be 3-32 characters, letters, numbers, _ or - only',
        code: 'username_invalid',
      },
    }
  }

  if (typeof password !== 'string' || password.length < PASSWORD_MIN) {
    return {
      status: 400,
      body: { error: 'Password must be at least 8 characters', code: 'password_too_short' },
    }
  }

  return null
}

// Must match users_username_lower_unique, or a differently-cased username would
// be rejected at registration but unusable at login.
function whereUsernameMatches(username) {
  return db.sequelize.where(
    db.sequelize.fn('lower', db.sequelize.col('username')),
    username.toLowerCase()
  )
}

// authLimiter runs first, and needs a parsed body for its username key — which it
// has, because express.json() runs in app.js before this router is mounted.
router.post('/register', authLimiter, async (req, res) => {
  const { username, password, session_id: sessionId } = req.body ?? {}

  const invalid = validateCredentials(username, password)
  if (invalid) {
    return res.status(invalid.status).json(invalid.body)
  }

  const existing = await db.User.findOne({ where: whereUsernameMatches(username) })
  if (existing) {
    return res.status(409).json({ error: 'That username is taken', code: 'username_taken' })
  }

  const password_hash = await bcrypt.hash(password, BCRYPT_COST)

  let user
  try {
    user = await db.User.create({ username, password_hash })
  } catch (error) {
    // Two registrations for the same name in the same instant: the index, not the
    // check above, is the real guard.
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'That username is taken', code: 'username_taken' })
    }
    throw error
  }

  const claimedRounds = await claimRoundsForSession(sessionId, user.id)

  res.status(201).json({
    token: signToken(user),
    user: { id: user.id, username: user.username },
    claimed_rounds: claimedRounds,
  })
})

router.post('/login', authLimiter, async (req, res) => {
  const { username, password, session_id: sessionId } = req.body ?? {}

  const rejection = {
    error: 'Wrong username or password',
    code: 'invalid_credentials',
  }

  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(401).json(rejection)
  }

  const user = await db.User.scope('withPassword').findOne({
    where: whereUsernameMatches(username),
  })

  // Same body AND same cost for "no such user" and "wrong password": the endpoint
  // must not tell an attacker which usernames exist. The throwaway compare below
  // is what equalises the timing — returning early here leaks existence far more
  // loudly than the response body ever could.
  if (!user) {
    await bcrypt.compare(password, NO_SUCH_USER_HASH)
    return res.status(401).json(rejection)
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash)
  if (!passwordMatches) {
    return res.status(401).json(rejection)
  }

  const claimedRounds = await claimRoundsForSession(sessionId, user.id)

  res.json({
    token: signToken(user),
    user: { id: user.id, username: user.username },
    claimed_rounds: claimedRounds,
  })
})

router.get('/me', requireAuth, (req, res) => {
  res.json({ id: req.user.id, username: req.user.username })
})

module.exports = router
