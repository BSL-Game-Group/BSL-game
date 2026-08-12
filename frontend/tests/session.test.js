import {
  SESSION_ID_KEY,
  createSessionId,
  getOrCreateSessionId,
  resetSessionIdCache,
} from '../src/state/session'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

beforeEach(() => {
  resetSessionIdCache()
  localStorage.clear()
})

test('mints a v4 uuid and stores it', () => {
  const id = getOrCreateSessionId()

  expect(id).toMatch(UUID_PATTERN)
  expect(localStorage.getItem(SESSION_ID_KEY)).toBe(id)
})

test('returns the same id on every call', () => {
  const first = getOrCreateSessionId()
  resetSessionIdCache()

  expect(getOrCreateSessionId()).toBe(first)
})

test('two ids are not the same', () => {
  expect(createSessionId()).not.toBe(createSessionId())
})

test('works without crypto.randomUUID, which needs a secure context', () => {
  // Reaching the app over plain http by IP means no randomUUID; getRandomValues
  // carries no such restriction.
  //
  // randomUUID lives on Crypto.prototype, so `delete crypto.randomUUID` deletes
  // nothing and leaves the method reachable — this test would pass green without
  // ever entering the fallback. Shadow it with an own property instead, then drop
  // the shadow to restore the original.
  Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true })

  try {
    expect(typeof crypto.randomUUID).toBe('undefined')
    expect(getOrCreateSessionId()).toMatch(UUID_PATTERN)
  } finally {
    delete crypto.randomUUID
  }

  expect(typeof crypto.randomUUID).toBe('function')
})

test('a throwing localStorage still yields a stable id for this page', () => {
  const getItem = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('denied')
  })
  const setItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('denied')
  })

  try {
    const first = getOrCreateSessionId()

    expect(first).toMatch(UUID_PATTERN)
    expect(getOrCreateSessionId()).toBe(first)
  } finally {
    getItem.mockRestore()
    setItem.mockRestore()
  }
})

test('the saved-game snapshot is untouched, so the start screen survives', () => {
  getOrCreateSessionId()

  expect(localStorage.getItem('bsl-game.saved-state.v1')).toBeNull()
})
