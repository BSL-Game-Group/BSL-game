// Same swallow-everything discipline as state/savedGame.js: storage that throws
// means "not signed in", never a crashed game.
export const AUTH_STORAGE_KEY = 'bsl-game.auth.v1'

export function readStoredToken() {
  try {
    return window.localStorage.getItem(AUTH_STORAGE_KEY)
  } catch {
    return null
  }
}

export function writeStoredToken(token) {
  try {
    window.localStorage.setItem(AUTH_STORAGE_KEY, token)
  } catch {
    // Signed in for this page only.
  }
}

export function clearStoredToken() {
  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
  } catch {
    // Nothing to do.
  }
}
