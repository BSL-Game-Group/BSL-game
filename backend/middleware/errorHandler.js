function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error)
  }

  console.error(error)

  const status = error.status ?? error.statusCode

  if (Number.isInteger(status) && status >= 400 && status < 500) {
    return res.status(status).json({ error: 'Malformed request', code: 'bad_request' })
  }

  res.status(500).json({ error: 'Internal server error', code: 'internal_error' })
}

module.exports = { errorHandler }
