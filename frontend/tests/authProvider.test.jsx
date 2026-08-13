import { render, screen, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AuthProvider } from '../src/auth/provider'
import { useAuth } from '../src/auth/context'
import { AUTH_STORAGE_KEY } from '../src/auth/storage'
import authService from '../src/services/auth'
import { AuthError } from '../src/services/auth'
import { SESSION_ID_KEY, resetSessionIdCache } from '../src/state/session'

jest.mock('../src/services/auth')

beforeEach(() => {
  jest.clearAllMocks()
  localStorage.clear()
  resetSessionIdCache()
})

// A window onto the context, so the tests assert on state rather than on markup.
function Probe() {
  const { user, loading, claimedRounds, login, register, logout } = useAuth()

  return (
    <div>
      <span data-testid="user">{user ? user.username : 'guest'}</span>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="claimed">{String(claimedRounds)}</span>
      <button onClick={() => login('Test_User', 'hunter2hunter2')}>login</button>
      <button onClick={() => register('Test_User', 'hunter2hunter2')}>register</button>
      <button onClick={logout}>logout</button>
    </div>
  )
}

const renderProbe = () => render(<AuthProvider><Probe /></AuthProvider>)

test('starts as a guest when nothing is stored', async () => {
  renderProbe()

  expect(screen.getByTestId('user')).toHaveTextContent('guest')
  await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
  expect(authService.me).not.toHaveBeenCalled()
})

test('a stored token is confirmed against the server on mount', async () => {
  localStorage.setItem(AUTH_STORAGE_KEY, 'token-123')
  authService.me.mockResolvedValue({ id: 1, username: 'Test_User' })

  renderProbe()

  await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('Test_User'))
  expect(authService.me).toHaveBeenCalledWith('token-123')
})

test('a rejected stored token drops the player to guest and forgets it', async () => {
  localStorage.setItem(AUTH_STORAGE_KEY, 'stale-token')
  authService.me.mockRejectedValue(new AuthError('unauthenticated', 401))

  renderProbe()

  await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
  expect(screen.getByTestId('user')).toHaveTextContent('guest')
  expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull()
})

test('logging in stores the token, the user and the claim count', async () => {
  localStorage.setItem(SESSION_ID_KEY, 'session-a')
  authService.login.mockResolvedValue({
    token: 'token-123',
    user: { id: 1, username: 'Test_User' },
    claimed_rounds: 3,
  })
  authService.me.mockResolvedValue({ id: 1, username: 'Test_User' })

  renderProbe()
  await act(async () => {
    screen.getByText('login').click()
  })

  expect(authService.login).toHaveBeenCalledWith({
    username: 'Test_User',
    password: 'hunter2hunter2',
    session_id: 'session-a',
  })
  expect(screen.getByTestId('user')).toHaveTextContent('Test_User')
  expect(screen.getByTestId('claimed')).toHaveTextContent('3')
  expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBe('token-123')
})

test('registering works the same way', async () => {
  localStorage.setItem(SESSION_ID_KEY, 'session-a')
  authService.register.mockResolvedValue({
    token: 'token-456',
    user: { id: 2, username: 'Test_User' },
    claimed_rounds: 0,
  })
  authService.me.mockResolvedValue({ id: 2, username: 'Test_User' })

  renderProbe()
  await act(async () => {
    screen.getByText('register').click()
  })

  expect(screen.getByTestId('user')).toHaveTextContent('Test_User')
  expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBe('token-456')
})

test('a failed login leaves the player a guest and rethrows for the form', async () => {
  authService.login.mockRejectedValue(new AuthError('invalid_credentials', 401))

  let caught = null
  function FailingProbe() {
    const { login } = useAuth()
    return (
      <button onClick={() => login('Test_User', 'wrong').catch((error) => { caught = error })}>
        login
      </button>
    )
  }

  render(<AuthProvider><FailingProbe /></AuthProvider>)
  await act(async () => {
    screen.getByText('login').click()
  })

  expect(caught).toBeInstanceOf(AuthError)
  expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull()
})

test('logging out clears the user and the token but not the session id', async () => {
  localStorage.setItem(SESSION_ID_KEY, 'session-a')
  localStorage.setItem(AUTH_STORAGE_KEY, 'token-123')
  authService.me.mockResolvedValue({ id: 1, username: 'Test_User' })

  renderProbe()
  await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('Test_User'))

  await act(async () => {
    screen.getByText('logout').click()
  })

  expect(screen.getByTestId('user')).toHaveTextContent('guest')
  expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull()
  expect(localStorage.getItem(SESSION_ID_KEY)).toBe('session-a')
})

test('a throwing localStorage leaves the app usable and signed out', async () => {
  const setItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('denied')
  })
  authService.login.mockResolvedValue({
    token: 'token-123',
    user: { id: 1, username: 'Test_User' },
    claimed_rounds: 0,
  })
  authService.me.mockResolvedValue({ id: 1, username: 'Test_User' })

  try {
    renderProbe()
    await act(async () => {
      screen.getByText('login').click()
    })

    expect(screen.getByTestId('user')).toHaveTextContent('Test_User')
  } finally {
    setItem.mockRestore()
  }
})

test('useAuth outside the provider is a clear error, not undefined', () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

  try {
    expect(() => render(<Probe />)).toThrow(/AuthProvider/)
  } finally {
    consoleError.mockRestore()
  }
})
