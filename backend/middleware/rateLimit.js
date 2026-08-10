const rateLimit = require('express-rate-limit')

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
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

module.exports = { authLimiter }
