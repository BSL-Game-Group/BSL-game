import { render, screen, fireEvent } from './test-utils'
import '@testing-library/jest-dom'
import EndPopup from '../src/components/EndPopup'
import { AuthContext } from '../src/auth/context'

const round = { id: 1, score: 3, correct_count: 3, answer_count: 5, owned: false }

function renderPopup(props = {}, authOverrides = {}) {
  const auth = {
    user: null,
    token: null,
    loading: false,
    claimedRounds: null,
    login: jest.fn().mockResolvedValue({}),
    register: jest.fn().mockResolvedValue({}),
    logout: jest.fn(),
    clearClaimedRounds: jest.fn(),
    ...authOverrides,
  }

  const view = render(
    <AuthContext.Provider value={auth}>
      <EndPopup
        open
        round={round}
        onKeepPlaying={jest.fn()}
        onExit={jest.fn()}
        {...props}
      />
    </AuthContext.Provider>
  )

  return { auth, view }
}

test('nothing is rendered while it is closed', () => {
  renderPopup({ open: false })

  expect(screen.queryByText('Round finished')).not.toBeInTheDocument()
})

test('a guest sees the score, the warning, and the offer', () => {
  renderPopup()

  expect(screen.getByRole('heading', { name: 'Round finished' })).toBeInTheDocument()
  expect(screen.getByText('You scored 3 out of 5.')).toBeInTheDocument()
  expect(
    screen.getByText('This score only lives in this browser until you keep it.')
  ).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Keep my score' })).toBeInTheDocument()
})

test('"keep my score" opens the form inline, in the popup', () => {
  renderPopup()

  fireEvent.click(screen.getByRole('button', { name: 'Keep my score' }))

  expect(screen.getByLabelText('Username')).toBeInTheDocument()
})

test('a signed-in player is told the round was saved, with no offer', () => {
  renderPopup({}, { user: { id: 1, username: 'test_user_b' } })

  expect(screen.getByText('Saved to your account.')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Keep my score' })).not.toBeInTheDocument()
})

test('signing in confirms how many rounds were rescued', () => {
  renderPopup({}, { user: { id: 1, username: 'test_user_b' }, claimedRounds: 3 })

  expect(screen.getByText('Rounds saved to your account: 3')).toBeInTheDocument()
})

test('the two ways out are still there, and still mean what they meant', () => {
  const onKeepPlaying = jest.fn()
  const onExit = jest.fn()
  renderPopup({ onKeepPlaying, onExit })

  fireEvent.click(screen.getByRole('button', { name: /^exitConfirm.no$/ }))
  expect(onKeepPlaying).toHaveBeenCalled()

  fireEvent.click(screen.getByRole('button', { name: /^exitConfirm.yes$/ }))
  expect(onExit).toHaveBeenCalled()
})

test('with nothing answered it is just the exit question again', () => {
  renderPopup({ round: null })

  expect(screen.queryByText(/You scored/)).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Keep my score' })).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: /^exitConfirm.yes$/ })).toBeInTheDocument()
})
