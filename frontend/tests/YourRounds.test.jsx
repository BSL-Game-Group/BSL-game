import { render, screen, act, waitFor } from './test-utils'
import '@testing-library/jest-dom'
import YourRounds from '../src/auth/YourRounds'
import { AuthContext } from '../src/auth/context'
import roundsService from '../src/services/rounds'

jest.mock('../src/services/rounds')

beforeEach(() => jest.clearAllMocks())

function renderRounds(user = { id: 1, username: 'test_user_b' }) {
  render(
    <AuthContext.Provider value={{ user, token: 'token-123', loading: false, logout: jest.fn() }}>
      <YourRounds />
    </AuthContext.Provider>
  )
}

const openPanel = () => act(() => {
  window.dispatchEvent(new Event('your-rounds-opened'))
})

test('nothing is fetched until the panel is opened', () => {
  renderRounds()

  expect(roundsService.getMyRounds).not.toHaveBeenCalled()
})

test('opening it lists the rounds newest first', async () => {
  roundsService.getMyRounds.mockResolvedValue([
    { id: 2, score: 11, correct_count: 11, answer_count: 15, createdAt: '2026-08-01T10:00:00Z' },
    { id: 1, score: 4, correct_count: 4, answer_count: 15, createdAt: '2026-07-01T10:00:00Z' },
  ])
  renderRounds()

  openPanel()

  await waitFor(() => expect(screen.getByText('11')).toBeInTheDocument())
  expect(roundsService.getMyRounds).toHaveBeenCalledWith('token-123')
  expect(screen.getByText('Your rounds')).toBeInTheDocument()
})

test('a player with no rounds is told so', async () => {
  roundsService.getMyRounds.mockResolvedValue([])
  renderRounds()

  openPanel()

  await waitFor(() => expect(screen.getByText('No rounds.')).toBeInTheDocument())
})

test('a failed fetch shows the empty state rather than crashing', async () => {
  roundsService.getMyRounds.mockRejectedValue(new Error('boom'))
  renderRounds()

  openPanel()

  await waitFor(() => expect(screen.getByText('No rounds.')).toBeInTheDocument())
})
