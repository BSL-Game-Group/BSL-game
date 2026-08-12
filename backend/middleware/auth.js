const db = require('../models')
const { verifyToken } = require('../utils/token')

async function resolveUser(req) {
  const header = req.get('authorization')

  if (!header) {
    return null
  }

  const [scheme, token] = header.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return null
  }

  const payload = verifyToken(token)

  if (!payload) {
    return null
  }

  return db.User.findByPk(payload.sub)
}

async function optionalAuth(req, res, next) {
  req.user = await resolveUser(req)
  next()
}

async function requireAuth(req, res, next) {
  req.user = await resolveUser(req)

  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required', code: 'unauthenticated' })
  }

  next()
}

module.exports = { requireAuth, optionalAuth }
