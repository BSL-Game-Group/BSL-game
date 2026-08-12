// The browser's identity for claiming guest rounds. Deliberately NOT part of the
// saved-game snapshot: App treats a valid snapshot as "already started", so
// writing one from the login form would hide the start screen forever. Keeping it
// separate also means the temporary quit button cannot orphan unclaimed rounds.
export const SESSION_ID_KEY = 'bsl-game.session.v1'

let cached = null

function readRaw() {
  try {
    return window.localStorage.getItem(SESSION_ID_KEY)
  } catch {
    // Private mode, disabled cookies: fall back to a per-page id.
    return null
  }
}

function writeRaw(value) {
  try {
    window.localStorage.setItem(SESSION_ID_KEY, value)
  } catch {
    // Unpersisted; the cached value still identifies this page's play.
  }
}

export function createSessionId() {
  // randomUUID needs a secure context — present on https and localhost, absent
  // over plain http by IP. getRandomValues has no such restriction.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-')
}

export function getOrCreateSessionId() {
  if (cached) {
    return cached
  }

  const stored = readRaw()

  if (stored) {
    cached = stored
    return cached
  }

  cached = createSessionId()
  writeRaw(cached)

  return cached
}

// Tests only: the cache is module state and would leak between cases.
export function resetSessionIdCache() {
  cached = null
}
