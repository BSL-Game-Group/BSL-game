const rateLimit = require('express-rate-limit')

const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 10

// One instance per route, never one instance shared between them: every
// rateLimit() call brings its own store, which is what keeps /register and
// /login counting independently.
//
// Sharing one was an unauthenticated denial of service against a named account.
// skipSuccessfulRequests only skips 2xx, so a stranger could spend a username's
// whole budget on taken-username 409s at /register and the account's real owner
// was then answered 429 at /login — a login they had never attempted, refused
// without anyone knowing their password. GET /api/leaderboard publishes the
// usernames to aim at, and express-rate-limit rejects at the gate, so a correct
// password does not get you past a full bucket.
//
// Both stay keyed on the username rather than the caller: the job is to slow
// guessing at one account, not to throttle whoever is asking.
function createUsernameLimiter() {
  return rateLimit({
    windowMs: WINDOW_MS,
    limit: MAX_ATTEMPTS,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => String(req.body?.username ?? '').toLowerCase(),
    validate: false,
    handler: (req, res) =>
      res.status(429).json({
        error: 'Too many attempts for this username. Try again in 15 minutes.',
        code: 'rate_limited',
      }),
  })
}

const registerLimiter = createUsernameLimiter()
const loginLimiter = createUsernameLimiter()

module.exports = { registerLimiter, loginLimiter }
