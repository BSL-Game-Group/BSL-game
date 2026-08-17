import { render, screen, fireEvent } from './test-utils'
import '@testing-library/jest-dom'
import AuthStatus from '../src/auth/AuthStatus'
import { AuthContext } from '../src/auth/context'

beforeEach(() => {
  jest.spyOn(window, 'confirm').mockImplementation(() => true)
})

afterEach(() => {
  jest.restoreAllMocks()
})

function renderWithAuth(value) {
  const auth = {
    user: null,
    token: null,
    loading: false,
    claimedRounds: null,
    login: jest.fn().mockResolvedValue({}),
    register: jest.fn().mockResolvedValue({}),
    logout: jest.fn(),
    clearClaimedRounds: jest.fn(),
    ...value,
  }

  render(
    <AuthContext.Provider value={auth}>
      <AuthStatus />
    </AuthContext.Provider>
  )

  return auth
}

test('a guest is told so and offered a way in', () => {
  renderWithAuth({ user: null })

  expect(screen.getByText('Playing as a guest')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument()
  expect(screen.queryByLabelText('Username')).not.toBeInTheDocument()
})

test('the form is a toggle, not a popup', () => {
  renderWithAuth({ user: null })

  fireEvent.click(screen.getByRole('button', { name: 'Log in' }))

  expect(screen.getByLabelText('Username')).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

  expect(screen.queryByLabelText('Username')).not.toBeInTheDocument()
})

test('a signed-in player sees their name and can log out', () => {
  const auth = renderWithAuth({ user: { id: 1, username: 'test_user_b' } })

  expect(screen.getByText('Signed in as test_user_b')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Log in' })).not.toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: 'Log out' }))

  expect(auth.logout).toHaveBeenCalled()
})

test('calls removeAccount and clears user on delete confirmation', async () => {
  const auth = renderWithAuth({
    user: { id: 1, username: 'testuser' },
    removeAccount: jest.fn().mockResolvedValue(true)
  })

  const deleteButton = screen.getByRole('button', { name: /delete|poista|radera/i })
  fireEvent.click(deleteButton)

  expect(window.confirm).toHaveBeenCalled()
  expect(auth.removeAccount).toHaveBeenCalledTimes(1)
})