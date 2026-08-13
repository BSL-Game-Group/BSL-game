import axios from 'axios'
import { getOrCreateSessionId } from '../state/session'

const bearer = (token) => (token ? { Authorization: `Bearer ${token}` } : {})

// The caller passes the answers; the session id is this module's business, so no
// component has to remember to attach it.
const submitRound = async (answers, token) => {
  const response = await axios.post(
    '/api/rounds',
    { session_id: getOrCreateSessionId(), answers },
    { headers: bearer(token) }
  )

  return response.data
}

const updateRound = async (roundId, answers, token) => {
  const response = await axios.patch(
    `/api/rounds/${roundId}`,
    { session_id: getOrCreateSessionId(), answers },
    { headers: bearer(token) }
  )

  return response.data
}

// The one entry point for "save what the player has answered so far". The first
// save creates the round, every later one rewrites that same row, so a play
// session stays one round — which matters because the leaderboard takes a user's
// best round rather than their total.
//
// An open round can still be refused: the player claimed it and then logged out
// (403), or the database was reset under them (404). Neither is worth losing the
// rest of their play over, so both fall back to starting a new round. Anything
// else — a 500, a dead network — is a real failure and is re-thrown.
const saveRound = async (answers, token, openRoundId = null) => {
  if (openRoundId === null) {
    return submitRound(answers, token)
  }

  try {
    return await updateRound(openRoundId, answers, token)
  } catch (error) {
    const status = error?.response?.status

    if (status === 403 || status === 404) {
      return submitRound(answers, token)
    }

    throw error
  }
}

const getMyRounds = async (token) => {
  const response = await axios.get('/api/me/rounds', { headers: bearer(token) })
  return response.data
}

const getLeaderboard = async () => {
  const response = await axios.get('/api/leaderboard')
  return response.data
}

export default { submitRound, updateRound, saveRound, getMyRounds, getLeaderboard }
