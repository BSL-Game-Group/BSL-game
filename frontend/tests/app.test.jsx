import { render, screen, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import App from '../src/App'
import { EventBus } from '../src/game/EventBus'

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

// The real EventBus is a Phaser emitter that is inert under jsdom, so route
// on/off/emit through a tiny in-memory registry (same approach as MainScene.test).
jest.mock('../src/game/EventBus', () => {
  const handlers = {}
  return {
    EventBus: {
      on: jest.fn((event, cb) => {
        ;(handlers[event] = handlers[event] || []).push(cb)
      }),
      off: jest.fn((event, cb) => {
        handlers[event] = (handlers[event] || []).filter((h) => h !== cb)
      }),
      emit: jest.fn((event, ...args) => {
        ;(handlers[event] || []).forEach((h) => h(...args))
      }),
    },
  }
})

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

function unlockLectureMaterials() {
  enterLectureRoom()
  act(() => {
    window.dispatchEvent(new Event('lecture-materials-unlocked'))
  })
}

function openCloset() {
  startGame()
  act(() => {
    window.dispatchEvent(new Event('closet-popup-opened'))
  })
}

function openAnswerPopup(level = 'BSL-2') {
  startGame()
  act(() => {
    window.dispatchEvent(
      new CustomEvent('answer-popup-opened', { detail: { level } })
    )
  })
}

const testMicrobe = {
  common_name: 'E. coli',
  bsl_level: 1,
  feedback_correct: 'Matched the containment perfectly.',
  feedback_incorrect: 'Wrong containment for this one.',
}

function openAnswerPopupWithMicrobe(level, microbe = testMicrobe) {
  startGame()
  act(() => {
    EventBus.emit('current-microbe-updated', microbe)
  })
  act(() => {
    window.dispatchEvent(
      new CustomEvent('answer-popup-opened', { detail: { level } })
    )
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
// START-SCREEN INSTRUCTIONS TESTS
// -----------------------------
describe('Start-screen instructions', () => {
  test('shows the "How to play" instructions before the game starts', () => {
    renderApp()

    expect(
      screen.getByRole('heading', { name: /how to play/i })
    ).toBeInTheDocument()
    expect(
      screen.getByText(/remember the bsl level/i)
    ).toBeInTheDocument()
  })

  test('hides the instructions once the game starts', () => {
    startGame()

    expect(
      screen.queryByRole('heading', { name: /how to play/i })
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

test('lecture materials section is hidden until unlocked at the info point', () => {
  enterLectureRoom()

  expect(screen.queryByRole('heading', { name: /lecture materials/i })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /show/i })).not.toBeInTheDocument()
})

test('lecture-materials-unlocked event reveals the Lecture Materials section', () => {
  unlockLectureMaterials()

  expect(screen.getByRole('heading', { name: /lecture materials/i })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /show/i })).toBeInTheDocument()
})

test('clicking the show button opens the lecture materials popup', () => {
  unlockLectureMaterials()

  fireEvent.click(screen.getByRole('button', { name: /show/i }))

  expect(screen.getByRole('heading', { name: /BSL Game Material \(Biosafety Levels\)/i })).toBeInTheDocument()
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

// -----------------------------
// ANSWER POPUP TESTS
// -----------------------------
test('answer popup opens when answer-popup-opened event is triggered', () => {
  openAnswerPopup('BSL-2')

  expect(screen.getByText(/BSL-2/i)).toBeInTheDocument()
})

test('answer popup does NOT appear without event', () => {
  startGame()

  expect(screen.queryByText(/BSL-2/i)).not.toBeInTheDocument()
})

test('answer popup closes when close button is clicked', () => {
  openAnswerPopup('BSL-2')

  fireEvent.click(screen.getByRole('button', { name: /close/i }))

  expect(screen.queryByText(/BSL-2/i)).not.toBeInTheDocument()
})

test('answer popup says Correct! when chosen room matches the microbe class', () => {
  openAnswerPopupWithMicrobe('BSL-1')

  expect(screen.getByText(/correct!/i)).toBeInTheDocument()
  expect(screen.getByText(/matched the containment perfectly/i)).toBeInTheDocument()
})

test('answer popup says Not quite when chosen room does not match the microbe class', () => {
  openAnswerPopupWithMicrobe('BSL-3')

  expect(screen.getByText(/not quite/i)).toBeInTheDocument()
  expect(screen.getByText(/wrong containment for this one/i)).toBeInTheDocument()
})

// -----------------------------
// INFO POPUP TESTS
// -----------------------------
test('info popup opens on info-popup-opened event and shows the steps', () => {
  startGame()

  act(() => {
    window.dispatchEvent(new Event('info-popup-opened'))
  })

  expect(
    screen.getByRole('heading', { name: /how to play/i })
  ).toBeInTheDocument()
  expect(screen.getByText(/remember the bsl level/i)).toBeInTheDocument()
})
