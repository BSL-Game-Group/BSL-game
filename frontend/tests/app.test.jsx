import { render, screen, fireEvent, act } from './test-utils'
import '@testing-library/jest-dom'
import App from '../src/App'
import { TranslationProvider } from '../src/i18n'
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

// A lightweight stand-in for ClosetPopup: simulating a real react-dnd
// drag-and-drop equip in jsdom isn't supported by this repo's test setup, so
// this exposes plain buttons that call the same onClose/onEquipmentChange
// props the real component would call.
jest.mock('../src/components/ClosetPopup/ClosetPopup', () => (props) => {
  if (!props.open) {
    return null
  }

  return (
    <div>
      <h2>Closet</h2>
      <p>Equipment</p>
      <button onClick={props.onClose}>Close</button>
      <button
        onClick={() =>
          props.onEquipmentChange({ mask: true, lab_coat: false, glasses: false, sunglasses: false })
        }
      >
        test-equip-mask
      </button>
      <button
        onClick={() =>
          props.onEquipmentChange({ mask: false, lab_coat: false, glasses: false, sunglasses: false })
        }
      >
        test-unequip-all
      </button>
    </div>
  )
})

jest.mock('../game/main', () => jest.fn(() => ({ destroy: jest.fn() })))

jest.mock('../src/services/bslMaterial', () => ({
  getMaterial: jest.fn(() => Promise.resolve({
    intro: { heading: 'International development', paragraphs: [] },
    riskGroups: { heading: 'The four risk groups', intro: '', factors: [] },
    bslLevels: [],
    organismTables: [],
    sources: [],
  })),
}))

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
  return render(
    <TranslationProvider>
      <App />
    </TranslationProvider>
  )
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

test('clicking the show button opens the lecture materials popup', async () => {
  unlockLectureMaterials()

  fireEvent.click(screen.getByRole('button', { name: /show/i }))

  expect(await screen.findByRole('heading', { name: /BSL Game Material \(Biosafety Levels\)/i })).toBeInTheDocument()
})

// -----------------------------
// CLOSET FEATURE TESTS
// -----------------------------
test('closet popup opens when event is triggered', () => {
  openCloset()

  expect(screen.getByRole('heading', { name: /closet/i })).toBeInTheDocument()
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

test('answer popup says Not quite when the room matches but required equipment is missing', () => {
  openAnswerPopupWithMicrobe('BSL-1')

  expect(screen.getByText(/not quite/i)).toBeInTheDocument()
  expect(screen.getByText(/your protective equipment did not fully match the required setup/i)).toBeInTheDocument()
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

// -----------------------------
// UNDRESS-BEFORE-NEXT-MICROBE TESTS
// -----------------------------
describe('PPE removal gate', () => {
  // The dressing room's wash-up spot (click or press R) dispatches this window
  // event — same one ClosetPopup listens to for resetting worn PPE.
  function washUp() {
    act(() => {
      window.dispatchEvent(new Event('quick-undress'))
    })
  }

  test('closing the answer popup always asks the player to wash up, even with no PPE equipped', () => {
    openAnswerPopup('BSL-2')

    fireEvent.click(screen.getByRole('button', { name: /close/i }))

    expect(EventBus.emit).toHaveBeenCalledWith('undress-required')
    expect(EventBus.emit).not.toHaveBeenCalledWith('request-new-microbe')
  })

  test('closing the answer popup while PPE is equipped also asks the player to wash up', () => {
    openAnswerPopup('BSL-2')

    act(() => {
      window.dispatchEvent(new Event('closet-popup-opened'))
    })
    fireEvent.click(screen.getByText('test-equip-mask'))
    fireEvent.click(screen.getAllByRole('button', { name: /close/i })[0])

    EventBus.emit.mockClear()

    fireEvent.click(screen.getByRole('button', { name: /close/i }))

    expect(EventBus.emit).toHaveBeenCalledWith('undress-required')
    expect(EventBus.emit).not.toHaveBeenCalledWith('request-new-microbe')
  })

  test('requests a new microbe once the player washes up, regardless of PPE state', () => {
    openAnswerPopup('BSL-2')

    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    EventBus.emit.mockClear()

    washUp()

    expect(EventBus.emit).toHaveBeenCalledWith('request-new-microbe')
  })

  test('washing up when no microbe has been handled yet does nothing', () => {
    startGame()
    EventBus.emit.mockClear()

    washUp()

    expect(EventBus.emit).not.toHaveBeenCalledWith('request-new-microbe')
  })
})
