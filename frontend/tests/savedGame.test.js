import {
  SAVED_GAME_KEY,
  SAVED_GAME_VERSION,
  MAX_AGE_MS,
  THROTTLE_MS,
  defaultSnapshot,
  loadSavedGame,
  patchSavedGame,
  patchSavedGameThrottled,
  savePlayerPosition,
  flushSavedGame,
  clearSavedGame,
} from '../src/state/savedGame'
import { unequipAll } from '../src/components/ClosetPopup/ItemConfig'

beforeEach(() => {
  clearSavedGame()
  localStorage.clear()
})

describe('defaultSnapshot', () => {
  test('spawns in the corridor with nothing equipped and no microbe', () => {
    const snapshot = defaultSnapshot()

    expect(snapshot.version).toBe(1)
    expect(snapshot.player).toEqual({ x: 590, y: 150 })
    expect(snapshot.equipped).toEqual(unequipAll())
    expect(snapshot.microbe).toBeNull()
    expect(snapshot.progress).toEqual({
      lectureVisited: false,
      materialsUnlocked: false,
      awaitingUndress: false,
      ventilationConnected: false,
    })
    expect(snapshot.popups.answerLevel).toBe('')
  })

  test('has no phantom respirator key', () => {
    expect(Object.keys(defaultSnapshot().equipped)).not.toContain('respirator')
  })
})

describe('patch and load', () => {
  test('nothing is saved until something is patched', () => {
    expect(loadSavedGame()).toBeNull()
  })

  test('a patch round-trips through storage', () => {
    patchSavedGame({ sessionId: 'session_abc', player: { x: 700, y: 300 } }, 1000)

    const loaded = loadSavedGame(1000)

    expect(loaded.sessionId).toBe('session_abc')
    expect(loaded.player).toEqual({ x: 700, y: 300 })
  })

  test('patches merge one level deep instead of replacing whole sections', () => {
    patchSavedGame({ progress: { lectureVisited: true } }, 1000)
    patchSavedGame({ progress: { materialsUnlocked: true } }, 1000)

    const loaded = loadSavedGame(1000)

    expect(loaded.progress.lectureVisited).toBe(true)
    expect(loaded.progress.materialsUnlocked).toBe(true)
  })

  test('the microbe is replaced wholesale, not merged', () => {
    patchSavedGame({ microbe: { id: 1, bsl_level: 2 } }, 1000)
    patchSavedGame({ microbe: { id: 9, bsl_level: 3 } }, 1000)

    expect(loadSavedGame(1000).microbe).toEqual({ id: 9, bsl_level: 3 })
  })

  test('every patch re-stamps savedAt', () => {
    patchSavedGame({ sessionId: 'a' }, 5000)

    expect(loadSavedGame(5000).savedAt).toBe(5000)
  })

  test('clearSavedGame removes the key', () => {
    patchSavedGame({ sessionId: 'a' }, 1000)

    clearSavedGame()

    expect(localStorage.getItem(SAVED_GAME_KEY)).toBeNull()
    expect(loadSavedGame(1000)).toBeNull()
  })
})

// A snapshot written straight to storage, bypassing patchSavedGame, so the test
// controls exactly what load() has to defend against. It deliberately does NOT
// call loadSavedGame() itself: load() rejects and DELETES an invalid snapshot, so
// a load inside the helper would make the assertions below pass for the wrong
// reason (empty key rather than rejected value). load() always re-reads storage,
// so there is no stale in-memory copy to worry about.
function seed(overrides = {}) {
  const snapshot = { ...defaultSnapshot(), savedAt: 1_000_000, ...overrides }
  localStorage.setItem(SAVED_GAME_KEY, JSON.stringify(snapshot))
  return snapshot
}

describe('validation', () => {
  test('keeps a snapshot that is nearly expired', () => {
    seed({ savedAt: 1_000_000 })

    expect(loadSavedGame(1_000_000 + MAX_AGE_MS - 60_000)).not.toBeNull()
  })

  test('discards a snapshot that is past the age limit', () => {
    seed({ savedAt: 1_000_000 })

    expect(loadSavedGame(1_000_000 + MAX_AGE_MS + 60_000)).toBeNull()
  })

  test('discards a snapshot stamped in the future beyond the skew tolerance', () => {
    seed({ savedAt: 1_000_000 })

    expect(loadSavedGame(1_000_000 - 10 * 60_000)).toBeNull()
  })

  test('discards a snapshot from a different version', () => {
    seed({ version: SAVED_GAME_VERSION + 1 })

    expect(loadSavedGame(1_000_000)).toBeNull()
  })

  test('discards a snapshot with a non-numeric savedAt', () => {
    seed({ savedAt: 'yesterday' })

    expect(loadSavedGame(1_000_000)).toBeNull()
  })

  test('discards malformed JSON', () => {
    localStorage.setItem(SAVED_GAME_KEY, '{not json')

    expect(loadSavedGame(1_000_000)).toBeNull()
  })

  test('discards a position outside the world bounds', () => {
    seed({ player: { x: 5000, y: 300 } })

    expect(loadSavedGame(1_000_000)).toBeNull()
  })

  test('discards a non-numeric position', () => {
    seed({ player: { x: null, y: 300 } })

    expect(loadSavedGame(1_000_000)).toBeNull()
  })

  test('a rejected snapshot is removed from storage, not left to be re-parsed', () => {
    seed({ savedAt: 1_000_000 })

    loadSavedGame(1_000_000 + MAX_AGE_MS + 60_000)

    expect(localStorage.getItem(SAVED_GAME_KEY)).toBeNull()
  })

  test('drops unknown equipment keys and defaults missing ones to false', () => {
    seed({ equipped: { lab_coat: true, not_a_real_item: true } })

    const loaded = loadSavedGame(1_000_000)

    expect(loaded.equipped.lab_coat).toBe(true)
    expect(loaded.equipped).not.toHaveProperty('not_a_real_item')
    expect(loaded.equipped.gloves_2).toBe(false)
    expect(Object.keys(loaded.equipped)).toEqual(Object.keys(unequipAll()))
  })

  test('keeps a microbe that has a numeric bsl_level', () => {
    seed({ microbe: { id: 3, bsl_level: 2 } })

    expect(loadSavedGame(1_000_000).microbe).toEqual({ id: 3, bsl_level: 2 })
  })

  test('drops a microbe without a numeric bsl_level instead of rejecting the save', () => {
    seed({ microbe: { id: 3 }, sessionId: 'session_keepme' })

    const loaded = loadSavedGame(1_000_000)

    expect(loaded.microbe).toBeNull()
    expect(loaded.sessionId).toBe('session_keepme')
  })

  test('coerces junk booleans rather than trusting them', () => {
    seed({ progress: { lectureVisited: 'yes', materialsUnlocked: 1, awaitingUndress: true } })

    const loaded = loadSavedGame(1_000_000)

    expect(loaded.progress.lectureVisited).toBe(false)
    expect(loaded.progress.materialsUnlocked).toBe(false)
    expect(loaded.progress.awaitingUndress).toBe(true)
  })

  test('a throwing localStorage never propagates', () => {
    // jsdom's localStorage instance is not directly spyable, so mock the
    // prototype method it delegates to (what Safari private mode would throw).
    const spy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })

    expect(() => loadSavedGame(1_000_000)).not.toThrow()
    expect(loadSavedGame(1_000_000)).toBeNull()

    spy.mockRestore()
  })
})

function storedSnapshot() {
  return JSON.parse(localStorage.getItem(SAVED_GAME_KEY))
}

describe('throttled writes', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('the first throttled patch writes immediately', () => {
    patchSavedGameThrottled({ player: { x: 100, y: 100 } }, 1000)

    expect(storedSnapshot().player).toEqual({ x: 100, y: 100 })
  })

  test('patches inside the throttle window coalesce into one trailing write', () => {
    patchSavedGameThrottled({ player: { x: 100, y: 100 } }, 1000)
    patchSavedGameThrottled({ player: { x: 200, y: 200 } }, 1100)
    patchSavedGameThrottled({ player: { x: 300, y: 300 } }, 1200)

    expect(storedSnapshot().player).toEqual({ x: 100, y: 100 })

    jest.advanceTimersByTime(THROTTLE_MS)

    expect(storedSnapshot().player).toEqual({ x: 300, y: 300 })
  })

  test('flushSavedGame writes a pending patch without waiting', () => {
    patchSavedGameThrottled({ player: { x: 100, y: 100 } }, 1000)
    patchSavedGameThrottled({ player: { x: 400, y: 400 } }, 1100)

    flushSavedGame()

    expect(storedSnapshot().player).toEqual({ x: 400, y: 400 })
  })

  test('an immediate patch is not delayed by a pending throttled one', () => {
    patchSavedGameThrottled({ player: { x: 100, y: 100 } }, 1000)
    patchSavedGameThrottled({ player: { x: 500, y: 500 } }, 1100)

    patchSavedGame({ progress: { awaitingUndress: true } }, 1200)

    expect(storedSnapshot().progress.awaitingUndress).toBe(true)
    expect(storedSnapshot().player).toEqual({ x: 500, y: 500 })
  })
})

describe('savePlayerPosition', () => {
  test('rounds coordinates to whole pixels', () => {
    savePlayerPosition(120.4, 300.6, 1000)

    expect(storedSnapshot().player).toEqual({ x: 120, y: 301 })
  })

  test('an unchanged position does not re-stamp savedAt, so an idle tab can still go stale', () => {
    savePlayerPosition(120, 300, 1000)
    savePlayerPosition(120, 300, 9_999_999)

    expect(storedSnapshot().savedAt).toBe(1000)
  })

  test('a changed position is recorded and re-stamps savedAt', () => {
    savePlayerPosition(120, 300, 1000)
    savePlayerPosition(121, 300, 2000)

    // The second call lands inside the throttle window, so it is pending rather
    // than written — flushing is what a page unload does.
    flushSavedGame()

    expect(storedSnapshot().savedAt).toBe(2000)
    expect(storedSnapshot().player).toEqual({ x: 121, y: 300 })
  })
})
