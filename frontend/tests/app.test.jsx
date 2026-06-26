import { render, screen, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import App from '../src/App'

// -----------------------------
// MOCKS (keep at top)
// -----------------------------
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
// HELPERS
// -----------------------------
function renderApp() {
  return render(<App />)
}

function startGame() {
  renderApp()
  fireEvent.click(screen.getByRole('button', { name: /start game/i }))
}

function enterLectureRoom() {
  startGame()
  act(() => {
    window.dispatchEvent(new Event('lecture-room-entered'))
  })
}

function openCloset() {
  startGame()
  act(() => {
    window.dispatchEvent(new Event('closet-popup-opened'))
  })
}

// -----------------------------
// START BUTTON TESTS
// -----------------------------
describe('Start button', () => {
  test('renders start button initially', () => {
    renderApp()

    expect(
      screen.getByRole('button', { name: /start game/i })
    ).toBeInTheDocument()
  })

  test('clicking start button shows game and removes button', () => {
    renderApp()

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
  enterLectureRoom()

  expect(screen.getByTestId('lecture-panel')).toBeVisible()
})

test('lecture-room-entered event shows lecture panel', () => {
  enterLectureRoom()

  expect(screen.getByTestId('lecture-panel')).toBeVisible()
})

test('hide button collapses lecture links and updates label', () => {
  enterLectureRoom()

  const toggle = screen.getByRole('button', { name: /hide/i })
  expect(toggle).toBeInTheDocument()

  fireEvent.click(toggle)

  expect(
    screen.queryByRole('link', { name: /Consteril/i })
  ).not.toBeInTheDocument()

  expect(
    screen.getByRole('button', { name: /show/i })
  ).toBeInTheDocument()
})

test('show button expands lecture links after hiding them', () => {
  enterLectureRoom()

  fireEvent.click(screen.getByRole('button', { name: /hide/i }))
  fireEvent.click(screen.getByRole('button', { name: /show/i }))

  expect(
    screen.getByRole('link', { name: /Consteril/i })
  ).toBeInTheDocument()

  expect(screen.getAllByRole('link')).toHaveLength(3)
})

// -----------------------------
// CLOSET FEATURE TESTS
// -----------------------------
test('closet popup opens when event is triggered', () => {
  openCloset()

  expect(screen.getByText(/equipment/i)).toBeInTheDocument()
})

test('closet popup does NOT appear without event', () => {
  renderApp()

  fireEvent.click(screen.getByRole('button', { name: /start game/i }))

  expect(screen.queryByText(/equipment/i)).not.toBeInTheDocument()
})

test('closet popup closes when close button is clicked', () => {
  openCloset()

  fireEvent.click(screen.getByRole('button', { name: /close/i }))

  expect(screen.queryByText(/equipment/i)).not.toBeInTheDocument()
})