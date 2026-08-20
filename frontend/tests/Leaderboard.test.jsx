import { render, screen, act, waitFor } from './test-utils'
import '@testing-library/jest-dom'
import Leaderboard from '../src/auth/Leaderboard'
import roundsService from '../src/services/rounds'

jest.mock('../src/services/rounds')

beforeEach(() => jest.clearAllMocks())

const openBoard = () => act(() => {
  window.dispatchEvent(new Event('leaderboard-opened'))
})

test('the board is public — no auth context needed', async () => {
  roundsService.getLeaderboard.mockResolvedValue([
    {
      username: 'test_user_b',
      score: 11,
      correct_count: 11,
      answer_count: 15,
      createdAt: '2026-08-01T10:00:00Z',
    },
  ])
  render(<Leaderboard />)

  openBoard()

  await waitFor(() => expect(screen.getByText('test_user_b')).toBeInTheDocument())
  expect(screen.getByText('Leaderboard')).toBeInTheDocument()
})

test('an empty board says so', async () => {
  roundsService.getLeaderboard.mockResolvedValue([])
  render(<Leaderboard />)

  openBoard()

  await waitFor(() => expect(screen.getByText('No rounds played.')).toBeInTheDocument())
})
