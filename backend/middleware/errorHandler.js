// The last middleware in app.js. Express 5 forwards a rejected async handler
// here instead of crashing, but its DEFAULT handler answers with an HTML page
// containing the stack trace unless NODE_ENV === 'production' — and NODE_ENV is
// set nowhere in this repo (not in backend/Dockerfile, docker-compose.yaml or
// backend/manifests/deployment.yaml; see the same reasoning in utils/token.js).
//
// Measured against express 5.2.1 before this existed: a route rejecting with a
// Sequelize connection error handed the client the source file paths and the
// database host and port. routes/auth.js is the only router that does not catch
// its own errors, so every /api/auth/* endpoint leaked that way.
//
// Four parameters is what makes Express treat this as an error handler rather
// than an ordinary one, so `next` must stay even though only one branch uses it.
function errorHandler(error, req, res, next) {
  // Something already started writing a response, so the status and headers are
  // gone and only Express can still do the right thing: abort the connection.
  if (res.headersSent) {
    return next(error)
  }

  // Hidden from the client, never from us: a 500 nobody can diagnose is worse
  // than the leak this replaces.
  console.error(error)

  // express.json() rejects a malformed body with a status-carrying 400, which
  // reached the same default handler and leaked identically. A client error keeps
  // its status; anything without one is ours, not theirs, and is a 500.
  const status = error.status ?? error.statusCode

  if (Number.isInteger(status) && status >= 400 && status < 500) {
    return res.status(status).json({ error: 'Malformed request', code: 'bad_request' })
  }

  res.status(500).json({ error: 'Internal server error', code: 'internal_error' })
}

module.exports = { errorHandler }
