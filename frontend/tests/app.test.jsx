import { render, screen, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import App from '../src/App'

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
  })
)

jest.mock('../src/Game', () => () => (
  <div data-testid="game-component">Game Loaded</div>
))

jest.mock('../game/main', () => jest.fn(() => ({ destroy: jest.fn() })))

// -----------------------------
// START BUTTON TESTS
// -----------------------------
describe('Start button', () => {
  test('renders start button initially', () => {
    render(<App />)

    expect(
      screen.getByRole('button', { name: /start game/i })
    ).toBeInTheDocument()
  })

  test('clicking start button shows game and removes button', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /start game/i }))

    expect(screen.getByTestId('game-component')).toBeInTheDocument()

    expect(
      screen.queryByRole('button', { name: /start game/i })
    ).not.toBeInTheDocument()
  })
})

// -----------------------------
// LECTURE PANEL TESTS
// -----------------------------
test('lecture panel is hidden before entering lecture room', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: /start game/i }))
  expect(screen.getByTestId('lecture-panel')).not.toBeVisible()
})

test('lecture-room-entered event shows lecture panel', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: /start game/i }))

  act(() => {
    window.dispatchEvent(new Event('lecture-room-entered'))
  })

  expect(screen.getByTestId('lecture-panel')).toBeVisible()
})

// -----------------------------
// CLOSET FEATURE TESTS
// -----------------------------
test('closet popup opens when event is triggered', () => {
  render(<App />)

  fireEvent.click(screen.getByRole('button', { name: /start game/i }))

  act(() => {
    window.dispatchEvent(new Event('closet-popup-opened'))
  })

  expect(
    screen.getByText(/choose equipment for bsl laboratory/i)
  ).toBeInTheDocument()
})

test('closet popup does NOT appear without event', () => {
  render(<App />)

  fireEvent.click(screen.getByRole('button', { name: /start game/i }))

  expect(
    screen.queryByText(/choose equipment for bsl laboratory/i)
  ).not.toBeInTheDocument()
})

// NEW: close behavior test (IMPORTANT FIX)
test('closet popup closes when onClose is triggered', () => {
  render(<App />)

  fireEvent.click(screen.getByRole('button', { name: /start game/i }))

  act(() => {
    window.dispatchEvent(new Event('closet-popup-opened'))
  })

  expect(
    screen.getByText(/choose equipment for bsl laboratory/i)
  ).toBeInTheDocument()

  // assumes ClosetPopup has a button like "close"
  fireEvent.click(screen.getByRole('button', { name: /close/i }))

  expect(
    screen.queryByText(/choose equipment for bsl laboratory/i)
  ).not.toBeInTheDocument()
})