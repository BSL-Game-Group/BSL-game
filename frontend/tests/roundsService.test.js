import axios from 'axios'
import roundsService from '../src/services/rounds'
import { SESSION_ID_KEY, resetSessionIdCache } from '../src/state/session'

jest.mock('axios')

beforeEach(() => {
  jest.clearAllMocks()
  resetSessionIdCache()
  localStorage.clear()
})

test('submitRound posts the answers with the browser session id', async () => {
  localStorage.setItem(SESSION_ID_KEY, 'session-a')
  axios.post.mockResolvedValue({ data: { id: 1, score: 1, owned: false } })

  const answers = [{ microbe_id: 3, chosen_level: 2, chosen_equipment: ['lab_coat'] }]
  const result = await roundsService.submitRound(answers)

  expect(axios.post).toHaveBeenCalledWith(
    '/api/rounds',
    { session_id: 'session-a', answers },
    { headers: {} }
  )
  expect(result.score).toBe(1)
})

test('submitRound sends the token when the player is signed in', async () => {
  localStorage.setItem(SESSION_ID_KEY, 'session-a')
  axios.post.mockResolvedValue({ data: { id: 1, owned: true } })

  await roundsService.submitRound([], 'token-123')

  expect(axios.post).toHaveBeenCalledWith(
    '/api/rounds',
    expect.anything(),
    { headers: { Authorization: 'Bearer token-123' } }
  )
})

test('getMyRounds requires and sends the token', async () => {
  axios.get.mockResolvedValue({ data: [{ id: 1, score: 4 }] })

  const rounds = await roundsService.getMyRounds('token-123')

  expect(axios.get).toHaveBeenCalledWith('/api/me/rounds', {
    headers: { Authorization: 'Bearer token-123' },
  })
  expect(rounds).toHaveLength(1)
})

test('the leaderboard needs no token', async () => {
  axios.get.mockResolvedValue({ data: [] })

  await roundsService.getLeaderboard()

  expect(axios.get).toHaveBeenCalledWith('/api/leaderboard')
})
