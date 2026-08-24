import { render, screen, fireEvent, act, cleanup } from './test-utils'
import '@testing-library/jest-dom'
import App from '../src/App'
import { TranslationProvider } from '../src/i18n'
import { AuthProvider } from '../src/auth/provider'
import roundsService from '../src/services/rounds'
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
  jest.clearAllMocks()
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

jest.mock('../src/services/auth', () => ({
  __esModule: true,
  default: {
    register: jest.fn(),
    login: jest.fn(),
    me: jest.fn(() => Promise.reject(new Error('no token in these tests'))),
  },
  AuthError: class AuthError extends Error {},
}))

jest.mock('../src/services/rounds', () => ({
  __esModule: true,
  default: {
    submitRound: jest.fn(),
    updateRound: jest.fn(),
    saveRound: jest.fn(() =>
      Promise.resolve({ id: 1, score: 0, correct_count: 0, answer_count: 1, owned: false })
    ),
    getMyRounds: jest.fn(() => Promise.resolve([])),
    getLeaderboard: jest.fn(() => Promise.resolve([])),
  },
}))

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
      <AuthProvider>
        <App />
      </AuthProvider>
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

function openLectureMaterialPopup() {
  unlockLectureMaterials()
  act(() => {
    window.dispatchEvent(new Event('lecture-material-popup-opened'))
  })
}

function openMicrobeInfoPopup() {
  unlockLectureMaterials()
  act(() => {
    window.dispatchEvent(new Event('microbe-info-popup-opened'))
  })
}

function openCloset() {
  startGame()

  act(() => {
    window.dispatchEvent(new Event('closet-popup-opened'))
  })
}

function triggerClosetPopup() {
  act(() => {
    window.dispatchEvent(new Event('closet-popup-opened'))
  })
}

function openExitPrompt() {
  startGame()
  act(() => {
    window.dispatchEvent(new Event('exit-popup-opened'))
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
// LECTURE ROOM TESTS
// -----------------------------

test('lecture material popup is closed initially', () => {
  startGame()

  expect(
    screen.queryByRole('heading', {
      name: /BSL Game Material \(Biosafety Levels\)/i,
    })
  ).not.toBeInTheDocument()
})

// 'lecture-material-popup-opened' is the exact event the lecture room's material
// point dispatches (see rooms.test.jsx, 'clicking the lecture-material point
// opens the lecture material popup'). Both sides assert the same literal, so
// renaming one alone fails the other instead of silently killing the button.
test('lecture-material-popup-opened opens the lecture material popup and loads material', async () => {
  openLectureMaterialPopup()

  expect(
    await screen.findByRole('heading', {
      name: /BSL Game Material \(Biosafety Levels\)/i,
    })
  ).toBeInTheDocument()

  expect(
    await screen.findByText(/International development/i)
  ).toBeInTheDocument()
})

test('the lecture material popup closes via its close button', async () => {
  openLectureMaterialPopup()

  const heading = await screen.findByRole('heading', {
    name: /BSL Game Material \(Biosafety Levels\)/i,
  })
  expect(heading).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: /close/i }))

  expect(
    screen.queryByRole('heading', {
      name: /BSL Game Material \(Biosafety Levels\)/i,
    })
  ).not.toBeInTheDocument()
})

// Phaser's BSL interactables gate on window.__lectureOpen (rooms.js/BslInteraction),
// so App has to mirror the visit onto window — without it every BSL room answers
// with "visit the lecture first" and the answer popup can never open.
test('entering the lecture room mirrors the visit onto window.__lectureOpen', () => {
  startGame()

  expect(window.__lectureOpen).toBe(false)

  act(() => {
    window.dispatchEvent(new Event('lecture-room-entered'))
  })

  expect(window.__lectureOpen).toBe(true)

  delete window.__lectureOpen
})

test('microbe info popup opens when the microbe info event is fired and a current microbe exists', async () => {
  startGame()

  const microbe = {
    common_name: 'E. coli',
    scientific_name: 'Escherichia coli',
    type: 'Bacterium',
    lecture_text: 'Common gut bacterium',
  }

  act(() => {
    EventBus.emit('current-microbe-updated', microbe)
    window.dispatchEvent(new Event('microbe-info-popup-opened'))
  })

  expect(
    await screen.findByRole('heading', {
      name: /microbe information/i,
    })
  ).toBeInTheDocument()

  expect(
    screen.getByText(/Escherichia coli/i)
  ).toBeInTheDocument()
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

test('exit confirmation popup opens and returns to the start screen when confirmed', () => {
  openExitPrompt()

  expect(screen.getByRole('heading', { name: /exit/i })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /yes/i })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /no/i })).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: /yes/i }))

  expect(screen.queryByTestId('game-component')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument()
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

  // The microbe's own feedback names the correct level, so it is withheld while the
  // retry is still on offer. The last attempt gets it — see the retry describe below.
  expect(screen.getByText(/the BSL room you chose was not correct/i)).toBeInTheDocument()
  expect(screen.queryByText(/wrong containment for this one/i)).not.toBeInTheDocument()
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

// -----------------------------
// BSL4 ENTRY CONFIRMATION
// -----------------------------
describe('BSL4 gear popup', () => {
  test('locks movement while open, unlocks when it closes', () => {
    const spy = jest.spyOn(window, 'dispatchEvent')
    startGame()

    act(() => {
      window.dispatchEvent(new Event('bsl4-suit-required'))
    })
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: 'popup-opened' }))

    spy.mockClear()
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: 'popup-closed' }))

    spy.mockRestore()
  })

  test('bsl4-suit-required shows the "put it on" prompt with suit/gloves buttons, no ventilation button yet', () => {
    startGame()

    act(() => {
      window.dispatchEvent(new Event('bsl4-suit-required'))
    })

    expect(screen.getByText(/you're in bsl4/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^put on suit$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^put on gloves$/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /connect ventilation/i })).not.toBeInTheDocument()
  })

  test('clicking Put on suit / Put on gloves equips them directly, no separate closet', () => {
    startGame()
    act(() => {
      window.dispatchEvent(new Event('bsl4-suit-required'))
    })

    fireEvent.click(screen.getByRole('button', { name: /^put on suit$/i }))
    fireEvent.click(screen.getByRole('button', { name: /^put on gloves$/i }))

    expect(screen.getByRole('button', { name: /^take off suit$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^take off gloves$/i })).toBeInTheDocument()
    expect(screen.queryByText('Equipment')).not.toBeInTheDocument()
  })

  test('once suited, a Connect ventilation button appears in the same prompt', () => {
    seedSavedGame({ equipped: { ...unequipAll(), pressurized_suit: true, gloves: true } })
    renderApp()

    act(() => {
      window.dispatchEvent(new Event('bsl4-suit-required'))
    })

    expect(screen.getByRole('button', { name: /^connect ventilation$/i })).toBeInTheDocument()
  })

  test('clicking Connect ventilation makes bsl4Ready true', () => {
    seedSavedGame({ equipped: { ...unequipAll(), pressurized_suit: true, gloves: true } })
    renderApp()
    act(() => {
      window.dispatchEvent(new Event('bsl4-suit-required'))
    })

    fireEvent.click(screen.getByRole('button', { name: /^connect ventilation$/i }))

    expect(window.__bsl4Ready).toBe(true)
    expect(screen.getByRole('button', { name: /^disconnect ventilation$/i })).toBeInTheDocument()
  })

  test('bsl4-undress-required shows the "take it off" prompt when already suited', () => {
    seedSavedGame({ equipped: { ...unequipAll(), pressurized_suit: true, gloves: true } })
    renderApp()

    act(() => {
      window.dispatchEvent(new Event('bsl4-undress-required'))
    })

    expect(screen.getByText(/decontaminate before leaving/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^take off suit$/i }))

    expect(screen.getByRole('button', { name: /^put on suit$/i })).toBeInTheDocument()
  })

  test('taking off the suit also unplugs the ventilation', () => {
    seedSavedGame({
      equipped: { ...unequipAll(), pressurized_suit: true, gloves: true },
      progress: { ...defaultSnapshot().progress, ventilationConnected: true },
    })
    renderApp()
    act(() => {
      window.dispatchEvent(new Event('bsl4-undress-required'))
    })

    fireEvent.click(screen.getByRole('button', { name: /^take off suit$/i }))

    expect(window.__bsl4Ready).toBe(false)
    expect(loadSavedGame().progress.ventilationConnected).toBe(false)
  })
})

// -----------------------------
// BSL4 VENTILATION & READINESS
// -----------------------------
describe('BSL4 ventilation hookup', () => {
  function toggleVentilation() {
    act(() => {
      window.dispatchEvent(new Event('ventilation-toggle-requested'))
    })
  }

  test('connecting does nothing while the suit is not worn', () => {
    startGame()

    toggleVentilation()

    expect(window.__bsl4Ready).toBe(false)
  })

  test('connecting succeeds once the suit and gloves are worn, making bsl4Ready true', () => {
    seedSavedGame({ equipped: { ...unequipAll(), pressurized_suit: true, gloves: true } })
    renderApp()

    toggleVentilation()

    expect(window.__bsl4Ready).toBe(true)
  })

  test('pressing the spot again disconnects', () => {
    seedSavedGame({ equipped: { ...unequipAll(), pressurized_suit: true, gloves: true } })
    renderApp()

    toggleVentilation()
    expect(window.__bsl4Ready).toBe(true)

    toggleVentilation()
    expect(window.__bsl4Ready).toBe(false)
  })

  test('taking off the suit unplugs ventilation but does NOT satisfy the wash-up gate — only the dressing room does', () => {
    seedSavedGame({
      equipped: { ...unequipAll(), pressurized_suit: true, gloves: true },
      progress: {
        ...defaultSnapshot().progress,
        ventilationConnected: true,
        awaitingUndress: true,
      },
    })
    renderApp()

    act(() => {
      window.dispatchEvent(new Event('bsl4-undress-required'))
    })
    EventBus.emit.mockClear()
    fireEvent.click(screen.getByRole('button', { name: /^take off suit$/i }))

    expect(window.__bsl4Ready).toBe(false)
    expect(loadSavedGame().progress.ventilationConnected).toBe(false)
    expect(EventBus.emit).not.toHaveBeenCalledWith('request-new-microbe')
    // The dressing room's own wash-up spot is still required, same as BSL1-3.
    act(() => {
      window.dispatchEvent(new Event('quick-undress'))
    })
    expect(EventBus.emit).toHaveBeenCalledWith('request-new-microbe')
  })

  test('bsl4-suit-forced-off strips the suit, unplugs ventilation, and closes the gear popup', () => {
    seedSavedGame({
      equipped: { ...unequipAll(), pressurized_suit: true, gloves: true },
      progress: { ...defaultSnapshot().progress, ventilationConnected: true },
    })
    renderApp()
    act(() => {
      window.dispatchEvent(new Event('bsl4-undress-required'))
    })
    expect(screen.getByText(/decontaminate before leaving/i)).toBeInTheDocument()

    act(() => {
      window.dispatchEvent(new Event('bsl4-suit-forced-off'))
    })

    expect(window.__bsl4Ready).toBe(false)
    expect(loadSavedGame().progress.ventilationConnected).toBe(false)
    expect(screen.queryByText(/decontaminate before leaving/i)).not.toBeInTheDocument()
  })

  test('bsl4-not-ready shows a closable warning popup', () => {
    startGame()

    act(() => {
      window.dispatchEvent(new Event('bsl4-not-ready'))
    })

    expect(screen.getByText(/not ready for bsl4/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /close/i }))

    expect(screen.queryByText(/not ready for bsl4/i)).not.toBeInTheDocument()
  })

  test('bsl-door-required shows a closable warning popup for BSL3', () => {
    startGame()

    act(() => {
      window.dispatchEvent(new Event('bsl-door-required'))
    })

    expect(screen.getByText(/close the airlock door first/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /close/i }))

    expect(screen.queryByText(/close the airlock door first/i)).not.toBeInTheDocument()
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

  test('restores saved game without showing a lecture panel', () => {
  seedSavedGame({
    progress: {
      lectureVisited: true,
      awaitingUndress: false,
    },
  })

  renderApp()

  expect(screen.queryByTestId('lecture-panel')).not.toBeInTheDocument()
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

  test('the equipment verdict follows the microbe, not the room the player chose', () => {
    seedSavedGame({
      microbe: testMicrobe,
      equipped: {
        ...unequipAll(),
        lab_coat: true,
        glasses: true,
        gloves: true,
        indoor_shoes: true,
      },
      popups: { ...defaultSnapshot().popups, answer: true, answerLevel: 'BSL-3' },
    })

    renderApp()

    expect(
      screen.getByText(/your protective equipment matched the required setup/i)
    ).toBeInTheDocument()
  })

  test('restores an open lecture material popup', async () => {
    seedSavedGame({
      popups: { ...defaultSnapshot().popups, lectureMaterial: true },
    })

    renderApp()

    expect(
      await screen.findByRole('heading', {
        name: /BSL Game Material \(Biosafety Levels\)/i,
      })
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
  
  test('microbe info popup state is persisted', () => {
    startGame()

    act(() => {
      window.dispatchEvent(new Event('microbe-info-popup-opened'))
    })

    expect(loadSavedGame().popups.microbeInfo).toBe(true)
  })

  // The key App writes has to be the key loadSavedGame() gives back, or the
  // popup silently fails to reopen after a reload.
  test('lecture material popup state is persisted', async () => {
    openLectureMaterialPopup()

    expect(
      await screen.findByRole('heading', {
        name: /BSL Game Material \(Biosafety Levels\)/i,
      })
    ).toBeInTheDocument()

    expect(loadSavedGame().popups.lectureMaterial).toBe(true)
  })

  test('an open popup is persisted', () => {
  startGame()

  triggerClosetPopup()

  expect(loadSavedGame().popups.closet).toBe(true)
  })

  test('worn PPE is persisted', () => {
  startGame()

  triggerClosetPopup()

  fireEvent.click(screen.getByText('test-equip-mask'))

  expect(loadSavedGame().equipped.mask).toBe(true)
})
})

// -----------------------------
// ROUND TESTS
// -----------------------------

const identifiedMicrobe = { ...testMicrobe, id: 7 }

function answerCurrentMicrobe(level = 'BSL-1', microbe = identifiedMicrobe) {
  act(() => {
    EventBus.emit('current-microbe-updated', microbe)
  })
  act(() => {
    window.dispatchEvent(new CustomEvent('answer-popup-opened', { detail: { level } }))
  })
  fireEvent.click(screen.getByRole('button', { name: /close/i }))
}

const reachExit = async () => {
  await act(async () => {
    window.dispatchEvent(new Event('exit-popup-opened'))
  })
}

test('reaching the exit saves what the player has answered so far', async () => {
  startGame()
  answerCurrentMicrobe('BSL-1')

  await reachExit()

  expect(roundsService.saveRound).toHaveBeenCalledWith(
    [{ microbe_id: 7, chosen_level: 1, chosen_equipment: [], correct: false, attempt: 1 }],
    null,
    null
  )
})

test('a second visit to the exit updates the same round', async () => {
  roundsService.saveRound.mockResolvedValue({
    id: 42,
    score: 0,
    correct_count: 0,
    answer_count: 1,
    owned: false,
  })
  startGame()
  answerCurrentMicrobe('BSL-1')

  await reachExit()
  fireEvent.click(screen.getByRole('button', { name: /no/i }))
  await reachExit()

  expect(roundsService.saveRound).toHaveBeenLastCalledWith(expect.anything(), null, 42)
})

test('the exit popup still opens when there is nothing to save', async () => {
  startGame()

  await reachExit()

  expect(roundsService.saveRound).not.toHaveBeenCalled()
  expect(screen.getByRole('button', { name: /yes/i })).toBeInTheDocument()
})

test('the answers and the open round are written to the snapshot', () => {
  startGame()
  answerCurrentMicrobe('BSL-1')

  expect(loadSavedGame().round.answers).toEqual([
    { microbe_id: 7, chosen_level: 1, chosen_equipment: [], correct: false, attempt: 1 },
  ])
})

test('leaving for the start screen abandons the round', async () => {
  startGame()
  answerCurrentMicrobe('BSL-1')
  await reachExit()

  fireEvent.click(screen.getByRole('button', { name: /yes/i }))

  expect(loadSavedGame()).toBeNull()
})

test('the score is on screen from the first moment of play', () => {
  startGame()

  expect(screen.getByTestId('score-hud')).toHaveTextContent('Score: 0')
  expect(screen.getByTestId('score-hud')).toHaveTextContent('Microbes: 0')
})

test('handling a microbe moves the counter', () => {
  startGame()

  answerCurrentMicrobe('BSL-1')

  expect(screen.getByTestId('score-hud')).toHaveTextContent('Microbes: 1')
  expect(screen.getByTestId('score-hud')).toHaveTextContent('Score: 0')
})

test('the score counts the correct answers already in the round', () => {
  localStorage.setItem(
    SAVED_GAME_KEY,
    JSON.stringify({
      ...defaultSnapshot(),
      savedAt: Date.now(),
      round: {
        openRoundId: 5,
        answers: [
          { microbe_id: 1, chosen_level: 1, chosen_equipment: ['lab_coat'], correct: true },
          { microbe_id: 2, chosen_level: 2, chosen_equipment: [], correct: false },
        ],
      },
    })
  )

  renderApp()

  expect(screen.getByTestId('score-hud')).toHaveTextContent('Score: 1')
  expect(screen.getByTestId('score-hud')).toHaveTextContent('Microbes: 2')
})

test('the start screen has no score to show', () => {
  renderApp()

  expect(screen.queryByTestId('score-hud')).not.toBeInTheDocument()
})

test('a guest can sign in from the start screen, before playing', () => {
  renderApp()

  expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument()
  expect(screen.getByText('Playing as a guest')).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: 'Log in' }))

  expect(screen.getByLabelText('Username')).toBeInTheDocument()
})

test('the exit popup reports the round it just saved', async () => {
  roundsService.saveRound.mockResolvedValue({
    id: 42,
    score: 0,
    correct_count: 0,
    answer_count: 1,
    owned: false,
  })
  startGame()
  answerCurrentMicrobe('BSL-1')

  await reachExit()

  expect(screen.getByRole('heading', { name: 'Round finished' })).toBeInTheDocument()
  expect(screen.getByText('You scored 0 out of 1.')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Keep my score' })).toBeInTheDocument()
})

describe('one retry per microbe', () => {
  // testMicrobe has no id, and an answer is only recorded for a microbe with an integer id.
  // It is BSL-1, so answering BSL-3 is wrong on the level.
  const retryMicrobe = { ...testMicrobe, id: 1 }

  function answerWrongly() {
    openAnswerPopupWithMicrobe('BSL-3', retryMicrobe)
  }

  function washUp() {
    act(() => {
      window.dispatchEvent(new Event('quick-undress'))
    })
  }

  function reopenPopup() {
    act(() => {
      window.dispatchEvent(new CustomEvent('answer-popup-opened', { detail: { level: 'BSL-3' } }))
    })
  }

  test('recording counts the answer and washing up hands out a new microbe', () => {
    answerWrongly()
    EventBus.emit.mockClear()

    fireEvent.click(screen.getByRole('button', { name: /^close$/i }))

    expect(screen.getByText(/microbes: 1/i)).toBeInTheDocument()
    expect(loadSavedGame().round.answers[0].attempt).toBe(1)

    washUp()

    expect(EventBus.emit).toHaveBeenCalledWith('request-new-microbe')
  })

  test('retrying records nothing and keeps the same microbe', () => {
    answerWrongly()
    EventBus.emit.mockClear()

    fireEvent.click(screen.getByRole('button', { name: /try again/i }))

    expect(screen.getByText(/microbes: 0/i)).toBeInTheDocument()
    expect(loadSavedGame().round.answers).toEqual([])

    washUp()

    expect(EventBus.emit).not.toHaveBeenCalledWith('request-new-microbe')

    reopenPopup()

    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^close$/i }))

    expect(loadSavedGame().round.answers[0].attempt).toBe(2)
  })

  test('the last attempt reveals the microbe feedback and its true class', () => {
    answerWrongly()
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    washUp()
    reopenPopup()

    expect(screen.getByText(/wrong containment for this one/i)).toBeInTheDocument()
    expect(screen.getByText(/E\. coli belongs to BSL-1/i)).toBeInTheDocument()
  })

  test('a new microbe restores the retry', () => {
    answerWrongly()
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    washUp()

    // The second try has to be spent and recorded: the wash-up that follows it is
    // what asks for the next microbe, and that request is what hands the retry back.
    reopenPopup()
    fireEvent.click(screen.getByRole('button', { name: /^close$/i }))
    washUp()

    act(() => {
      EventBus.emit('current-microbe-updated', { ...retryMicrobe, id: 2 })
    })
    reopenPopup()

    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })
})

test('the wash-up prompt appears and the flag is visible to Phaser', () => {
  openAnswerPopupWithMicrobe('BSL-3', { ...testMicrobe, id: 1 })
  fireEvent.click(screen.getByRole('button', { name: /^close$/i }))

  expect(window.__awaitingUndress).toBe(true)

  act(() => {
    window.dispatchEvent(new Event('wash-up-required'))
  })

  expect(screen.getByText(/wash up before you get the next microbe/i)).toBeInTheDocument()

  act(() => {
    window.dispatchEvent(new Event('quick-undress'))
  })

  expect(window.__awaitingUndress).toBe(false)
})

// main_scene re-emits current-microbe-updated with the RESTORED microbe on every
// scene create, so a page load looks exactly like a new microbe being handed out.
// Resetting the attempt on that event handed the player unlimited retries.
describe('a refresh does not hand back a spent retry', () => {
  const retryMicrobe = { ...testMicrobe, id: 1 }

  function boot() {
    renderApp()
    const start = screen.queryByRole('button', { name: /start game/i })
    if (start) {
      fireEvent.click(start)
    }
    act(() => {
      EventBus.emit('current-microbe-updated', retryMicrobe)
    })
  }

  function answerWrongly() {
    act(() => {
      window.dispatchEvent(new CustomEvent('answer-popup-opened', { detail: { level: 'BSL-3' } }))
    })
  }

  function reload() {
    cleanup()
    boot()
  }

  function washUp() {
    act(() => {
      window.dispatchEvent(new Event('quick-undress'))
    })
  }

  test('refreshing on the last try does not bring the button back', () => {
    boot()
    answerWrongly()
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    washUp()
    answerWrongly()

    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument()

    reload()

    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument()
    expect(screen.getByText(/last try/i)).toBeInTheDocument()
  })

  test('refreshing mid-retry still owes the same microbe, not a new one', () => {
    boot()
    answerWrongly()
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))

    reload()
    EventBus.emit.mockClear()
    washUp()

    expect(EventBus.emit).not.toHaveBeenCalledWith('request-new-microbe')
  })
})

// Quitting inside BSL-4 used to leave bslRoom set, so the next game opened with
// the airlock panel listing suit, gloves and ventilation at the spawn point —
// the reset stripped the gear but not the room the player had been standing in.
test('resetting the game forgets which BSL room the player was in', () => {
  startGame()

  act(() => {
    window.dispatchEvent(
      new CustomEvent('bsl-room-changed', { detail: { key: 'BSL-4' } })
    )
  })

  expect(screen.getByTestId('bsl-airlock-status')).toBeInTheDocument()

  act(() => {
    window.dispatchEvent(new Event('game-reset-state'))
  })

  fireEvent.click(screen.getByRole('button', { name: /start game/i }))

  expect(screen.queryByTestId('bsl-airlock-status')).not.toBeInTheDocument()
})
