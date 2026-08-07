const db = require('../models')

// Re-points a browser's unclaimed rounds at an account. The `user_id: null`
// predicate is what makes this safe to run on every login: a round somebody
// already owns is never touched, so a shared browser cannot be used to steal one.
//
// Returns the number of rounds claimed, which the UI renders as
// "N rounds saved to your account". Zero is an ordinary outcome, not an error —
// it is what a player who signs in before ever playing will get.
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
