import { render, screen, fireEvent, act } from './test-utils'
import '@testing-library/jest-dom'
import AuthForm from '../src/auth/AuthForm'
import { AuthContext } from '../src/auth/context'
import { AuthError } from '../src/services/auth'

function renderForm(overrides = {}, props = {}) {
  const auth = {
    user: null,
    token: null,
    loading: false,
    claimedRounds: null,
    login: jest.fn().mockResolvedValue({}),
    register: jest.fn().mockResolvedValue({}),
    logout: jest.fn(),
    clearClaimedRounds: jest.fn(),
    ...overrides,
  }

  render(
    <AuthContext.Provider value={auth}>
      <AuthForm idPrefix="test" {...props} />
    </AuthContext.Provider>
  )

  return auth
}

const fillIn = (username, password) => {
  fireEvent.change(screen.getByLabelText('Username'), { target: { value: username } })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: password } })
}

const submit = async (name) => {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name }))
  })
}

test('it opens in login mode', () => {
  renderForm()

  expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument()
  expect(screen.queryByText(/no password recovery/i)).not.toBeInTheDocument()
})

test('submitting logs in and reports success', async () => {
  const onSuccess = jest.fn()
  const auth = renderForm({}, { onSuccess })
  fillIn('test_user_b', 'hunter2hunter2')

  await submit('Log in')

  expect(auth.login).toHaveBeenCalledWith('test_user_b', 'hunter2hunter2')
  expect(onSuccess).toHaveBeenCalled()
})

test('switching to sign-up registers instead, and warns about the password', async () => {
  const auth = renderForm()

  fireEvent.click(screen.getByRole('button', { name: 'No account yet? Create one' }))

  expect(screen.getByText(/no password recovery/i)).toBeInTheDocument()

  fillIn('test_user_b', 'hunter2hunter2')
  await submit('Create account')

  expect(auth.register).toHaveBeenCalledWith('test_user_b', 'hunter2hunter2')
})

test('a server error is shown translated and the form stays put', async () => {
  const onSuccess = jest.fn()
  renderForm(
    { login: jest.fn().mockRejectedValue(new AuthError('invalid_credentials', 401)) },
    { onSuccess }
  )
  fillIn('test_user_b', 'wrongpassword')

  await submit('Log in')

  expect(screen.getByRole('alert')).toHaveTextContent('Wrong username or password.')
  expect(screen.getByLabelText('Username')).toBeInTheDocument()
  expect(onSuccess).not.toHaveBeenCalled()
})

test('an unrecognised error code still says something useful', async () => {
  renderForm({ login: jest.fn().mockRejectedValue(new AuthError('teapot', 418)) })
  fillIn('test_user_b', 'hunter2hunter2')

  await submit('Log in')

  expect(screen.getByRole('alert')).toHaveTextContent('Could not reach the server. Try again.')
})

test('the ids are prefixed so two forms can be open at once', () => {
  const auth = {
    user: null,
    token: null,
    loading: false,
    claimedRounds: null,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    clearClaimedRounds: jest.fn(),
  }

  render(
    <AuthContext.Provider value={auth}>
      <>
        <AuthForm idPrefix="hud-auth" />
        <AuthForm idPrefix="end-popup-auth" />
      </>
    </AuthContext.Provider>
  )

  expect(document.getElementById('hud-auth-username')).toBeInTheDocument()
  expect(document.getElementById('end-popup-auth-username')).toBeInTheDocument()
})
