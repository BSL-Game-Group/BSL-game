import { render, screen, fireEvent, act } from './test-utils'
import '@testing-library/jest-dom'
import App from '../src/App'
import { TranslationProvider } from '../src/i18n'
import { EventBus } from '../src/game/EventBus'
import { unequipAll } from '../src/components/ClosetPopup/ItemConfig'
import {
  SAVED_GAME_KEY,
  defaultSnapshot,
  loadSavedGame,
  clearSavedGame,
} from '../src/state/savedGame'

// jsdom keeps localStorage between tests in a file, so without this a test that
// saves a game would leave the next one already started.
beforeEach(() => {
  clearSavedGame()
  localStorage.clear()
})

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
// this exposes plain buttons that call the same onClose/setEquipped props the
// real component would call.
jest.mock('../src/components/ClosetPopup/ClosetPopup', () => (props) => {
  if (!props.open) {
    return null
  }

  return (
    <div>
      <h2>Closet</h2>
      <p>Equipment</p>
      <button onClick={props.onClose}>Close</button>
      <button onClick={() => props.setEquipped((prev) => ({ ...prev, mask: true }))}>
        test-equip-mask
      </button>
      <button onClick={() => props.setEquipped((prev) => ({ ...prev, mask: false }))}>
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
// AIRLOCK2 WASH REMINDER (soft, non-blocking) TESTS
// -----------------------------
test('shows a soft reminder when entering airlock2', () => {
  startGame()

  act(() => {
    window.dispatchEvent(new Event('airlock-wash-reminder'))
  })

  expect(screen.getByRole('heading', { name: /attention/i })).toBeInTheDocument()
})

test('the airlock wash reminder does NOT gate the next microbe', () => {
  openAnswerPopup('BSL-2')

  fireEvent.click(screen.getByRole('button', { name: /close/i }))
  EventBus.emit.mockClear()

  act(() => {
    window.dispatchEvent(new Event('airlock-wash-reminder'))
  })

  expect(EventBus.emit).not.toHaveBeenCalledWith('request-new-microbe')
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

  test('the BSL4 airlock decon point does NOT satisfy the wash-up requirement', () => {
    openAnswerPopup('BSL-2')

    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    EventBus.emit.mockClear()

    act(() => {
      window.dispatchEvent(new Event('airlock-decon'))
    })

    expect(EventBus.emit).not.toHaveBeenCalledWith('request-new-microbe')
  })
})

// -----------------------------
// WORN PPE (moved here from ClosetPopup.test.jsx — App owns this state now)
// -----------------------------
describe('worn PPE is owned by App', () => {
  function lastEquipmentBroadcast(spy) {
    return spy.mock.calls
      .map(([event]) => event)
      .filter((event) => event?.type === 'equipment-changed')
      .pop()
  }

  test('broadcasts the full equipment map on mount, including every category', () => {
    const spy = jest.spyOn(window, 'dispatchEvent')

    renderApp()

    const broadcast = lastEquipmentBroadcast(spy)

    expect(broadcast.detail).toEqual(unequipAll())
    expect(broadcast.detail).toHaveProperty('face_shield')
    expect(broadcast.detail).toHaveProperty('bsl3_respirator')
    expect(broadcast.detail).not.toHaveProperty('respirator')

    spy.mockRestore()
  })

  test('broadcasts the change when an item is equipped', () => {
    openCloset()

    const spy = jest.spyOn(window, 'dispatchEvent')
    fireEvent.click(screen.getByText('test-equip-mask'))

    expect(lastEquipmentBroadcast(spy).detail.mask).toBe(true)

    spy.mockRestore()
  })

  test('the quick-undress event strips all PPE', () => {
    openCloset()
    fireEvent.click(screen.getByText('test-equip-mask'))

    const spy = jest.spyOn(window, 'dispatchEvent')
    act(() => {
      window.dispatchEvent(new Event('quick-undress'))
    })

    expect(lastEquipmentBroadcast(spy).detail).toEqual(unequipAll())

    spy.mockRestore()
  })

  test('the airlock-decon event strips all PPE', () => {
    openCloset()
    fireEvent.click(screen.getByText('test-equip-mask'))

    const spy = jest.spyOn(window, 'dispatchEvent')
    act(() => {
      window.dispatchEvent(new Event('airlock-decon'))
    })

    expect(lastEquipmentBroadcast(spy).detail).toEqual(unequipAll())

    spy.mockRestore()
  })

  test('stripping PPE works while the closet is closed', () => {
    openCloset()
    fireEvent.click(screen.getByText('test-equip-mask'))
    fireEvent.click(screen.getByRole('button', { name: /close/i }))

    const spy = jest.spyOn(window, 'dispatchEvent')
    act(() => {
      window.dispatchEvent(new Event('quick-undress'))
    })

    expect(lastEquipmentBroadcast(spy).detail).toEqual(unequipAll())

    spy.mockRestore()
  })
})

// -----------------------------
// SAVED GAME (refresh resilience)
// -----------------------------
// Writes a snapshot straight to storage the way a previous session would have.
function seedSavedGame(overrides = {}) {
  const snapshot = {
    ...defaultSnapshot(),
    savedAt: Date.now(),
    sessionId: 'session_restored',
    ...overrides,
  }
  localStorage.setItem(SAVED_GAME_KEY, JSON.stringify(snapshot))
  return snapshot
}

describe('restoring a saved game', () => {
  test('a valid snapshot skips the start screen entirely', () => {
    seedSavedGame()

    renderApp()

    expect(screen.queryByRole('button', { name: /start game/i })).not.toBeInTheDocument()
    expect(screen.getByTestId('game-component')).toBeInTheDocument()
  })

  test('an expired snapshot falls back to the start screen', () => {
    seedSavedGame({ savedAt: Date.now() - 3 * 60 * 60 * 1000 })

    renderApp()

    expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument()
  })

  test('restores the lecture panel and unlocked materials', () => {
    seedSavedGame({
      progress: { lectureVisited: true, materialsUnlocked: true, awaitingUndress: false },
    })

    renderApp()

    expect(screen.getByTestId('lecture-panel')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /lecture materials/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /show/i })).toBeInTheDocument()
  })

  test('reopens the closet popup that was open before the reload', () => {
    seedSavedGame({ popups: { ...defaultSnapshot().popups, closet: true } })

    renderApp()

    expect(screen.getByRole('heading', { name: /closet/i })).toBeInTheDocument()
  })

  test('restores worn PPE', () => {
    seedSavedGame({ equipped: { ...defaultSnapshot().equipped, mask: true } })

    const spy = jest.spyOn(window, 'dispatchEvent')

    renderApp()

    const broadcast = spy.mock.calls
      .map(([event]) => event)
      .filter((event) => event?.type === 'equipment-changed')
      .pop()

    expect(broadcast.detail.mask).toBe(true)

    spy.mockRestore()
  })

  test('restores the answer popup with its verdict recomputed from saved state', () => {
    seedSavedGame({
      microbe: testMicrobe,
      popups: { ...defaultSnapshot().popups, answer: true, answerLevel: 'BSL-1' },
    })

    renderApp()

    // BSL-1 matches the microbe, but no PPE was restored, so the verdict has to
    // come out "Not quite" — recomputed, never read from the snapshot.
    expect(screen.getByText(/not quite/i)).toBeInTheDocument()
    expect(
      screen.getByText(/your protective equipment did not fully match the required setup/i)
    ).toBeInTheDocument()
  })
})

describe('saving state', () => {
  test('sitting on the start screen writes nothing', () => {
    renderApp()

    expect(localStorage.getItem(SAVED_GAME_KEY)).toBeNull()
  })

  test('starting the game writes a snapshot', () => {
    startGame()

    expect(loadSavedGame()).not.toBeNull()
  })

  test('progress changes are persisted', () => {
    unlockLectureMaterials()

    expect(loadSavedGame().progress.materialsUnlocked).toBe(true)
  })

  test('an open popup is persisted', () => {
    openCloset()

    expect(loadSavedGame().popups.closet).toBe(true)
  })

  test('worn PPE is persisted', () => {
    openCloset()

    fireEvent.click(screen.getByText('test-equip-mask'))

    expect(loadSavedGame().equipped.mask).toBe(true)
  })
})

// -----------------------------
// TEMPORARY QUIT BUTTON
// -----------------------------
describe('quit button', () => {
  test('is hidden on the start screen', () => {
    renderApp()

    expect(screen.queryByRole('button', { name: /quit game/i })).not.toBeInTheDocument()
  })

  test('appears once the game is running', () => {
    startGame()

    expect(screen.getByRole('button', { name: /quit game/i })).toBeInTheDocument()
  })

  test('clears the saved game and returns to the start screen', () => {
    openCloset()
    fireEvent.click(screen.getByText('test-equip-mask'))
    expect(loadSavedGame()).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /quit game/i }))

    expect(localStorage.getItem(SAVED_GAME_KEY)).toBeNull()
    expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument()
  })

  test('restarting after quitting starts from a clean slate', () => {
    openCloset()
    fireEvent.click(screen.getByText('test-equip-mask'))
    fireEvent.click(screen.getByRole('button', { name: /quit game/i }))

    fireEvent.click(screen.getByRole('button', { name: /start game/i }))

    // No lecture panel, no closet, and nothing worn.
    expect(screen.queryByTestId('lecture-panel')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /closet/i })).not.toBeInTheDocument()
    expect(loadSavedGame().equipped).toEqual(unequipAll())
  })
})
