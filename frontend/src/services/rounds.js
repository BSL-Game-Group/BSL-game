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

const getMyRounds = async (token) => {
  const response = await axios.get('/api/me/rounds', { headers: bearer(token) })
  return response.data
}

const getLeaderboard = async () => {
  const response = await axios.get('/api/leaderboard')
  return response.data
}

export default { submitRound, getMyRounds, getLeaderboard }
