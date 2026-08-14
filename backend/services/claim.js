const db = require('../models')

async function claimRoundsForSession(sessionId, userId, options = {}) {
  if (typeof sessionId !== 'string' || sessionId.length === 0) {
    return 0
  }

  const [claimedCount] = await db.Round.update(
    { user_id: userId, claimed_at: new Date() },
    {
      where: { session_id: sessionId, user_id: null },
      transaction: options.transaction,
    }
  )

  return claimedCount
}

module.exports = { claimRoundsForSession }
