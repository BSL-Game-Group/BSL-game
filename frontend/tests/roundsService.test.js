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

test('updateRound patches the open round with the session id', async () => {
  localStorage.setItem(SESSION_ID_KEY, 'session-a')
  axios.patch.mockResolvedValue({ data: { id: 42, score: 2 } })

  const answers = [{ microbe_id: 3, chosen_level: 2, chosen_equipment: ['lab_coat'] }]
  const result = await roundsService.updateRound(42, answers, 'token-123')

  expect(axios.patch).toHaveBeenCalledWith(
    '/api/rounds/42',
    { session_id: 'session-a', answers },
    { headers: { Authorization: 'Bearer token-123' } }
  )
  expect(result.id).toBe(42)
})

test('saveRound creates the round the first time', async () => {
  localStorage.setItem(SESSION_ID_KEY, 'session-a')
  axios.post.mockResolvedValue({ data: { id: 7 } })

  const result = await roundsService.saveRound([], null, null)

  expect(axios.post).toHaveBeenCalled()
  expect(axios.patch).not.toHaveBeenCalled()
  expect(result.id).toBe(7)
})

test('saveRound updates the same round after that', async () => {
  localStorage.setItem(SESSION_ID_KEY, 'session-a')
  axios.patch.mockResolvedValue({ data: { id: 7 } })

  await roundsService.saveRound([], null, 7)

  expect(axios.patch).toHaveBeenCalled()
  expect(axios.post).not.toHaveBeenCalled()
})

test('a refused update starts a new round rather than losing the play', async () => {
  localStorage.setItem(SESSION_ID_KEY, 'session-a')
  axios.patch.mockRejectedValue({ response: { status: 403 } })
  axios.post.mockResolvedValue({ data: { id: 9 } })

  const result = await roundsService.saveRound([], null, 7)

  expect(result.id).toBe(9)
})

test('any other failure is the caller s problem', async () => {
  localStorage.setItem(SESSION_ID_KEY, 'session-a')
  axios.patch.mockRejectedValue({ response: { status: 500 } })

  await expect(roundsService.saveRound([], null, 7)).rejects.toBeDefined()
  expect(axios.post).not.toHaveBeenCalled()
})
