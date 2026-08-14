import axios from 'axios'
import authService, { AuthError } from '../src/services/auth'

jest.mock('axios')

beforeEach(() => {
  jest.clearAllMocks()
})

test('register posts the credentials and the session id', async () => {
  axios.post.mockResolvedValue({ data: { token: 't', user: { id: 1, username: 'Test_User' }, claimed_rounds: 2 } })

  const result = await authService.register({
    username: 'Test_User',
    password: 'hunter2hunter2',
    session_id: 'session-a',
  })

  expect(axios.post).toHaveBeenCalledWith('/api/auth/register', {
    username: 'Test_User',
    password: 'hunter2hunter2',
    session_id: 'session-a',
  })
  expect(result.claimed_rounds).toBe(2)
})

test('a rejected register surfaces the server code', async () => {
  axios.post.mockRejectedValue({
    response: { status: 409, data: { error: 'taken', code: 'username_taken' } },
  })

  await expect(
    authService.register({ username: 'Test_User', password: 'hunter2hunter2' })
  ).rejects.toMatchObject({ code: 'username_taken', status: 409 })
})

test('a server that cannot be reached becomes a network AuthError', async () => {
  axios.post.mockRejectedValue(new Error('Network Error'))

  const error = await authService
    .login({ username: 'Test_User', password: 'hunter2hunter2' })
    .catch((caught) => caught)

  expect(error).toBeInstanceOf(AuthError)
  expect(error.code).toBe('network')
})

test('me sends the bearer token', async () => {
  axios.get.mockResolvedValue({ data: { id: 1, username: 'Test_User' } })

  const user = await authService.me('token-123')

  expect(axios.get).toHaveBeenCalledWith('/api/auth/me', {
    headers: { Authorization: 'Bearer token-123' },
  })
  expect(user.username).toBe('Test_User')
})
