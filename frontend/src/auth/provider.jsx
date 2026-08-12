import { useCallback, useEffect, useState } from 'react'
import { AuthContext } from './context'
import authService from '../services/auth'
import { getOrCreateSessionId } from '../state/session'
import { AUTH_STORAGE_KEY, clearStoredToken, readStoredToken, writeStoredToken } from './storage'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => readStoredToken())
  const [user, setUser] = useState(null)
  // Only a stored token needs confirming; a first-time visitor is a guest at once.
  const [loading, setLoading] = useState(() => Boolean(readStoredToken()))
  const [claimedRounds, setClaimedRounds] = useState(null)

  // Confirms a token that came out of storage. A token we just received from
  // login/register is already known-good, so `user` is set there and this only
  // re-confirms it — cheap, and it keeps one code path for "is this token real".
  useEffect(() => {
    // No synchronous setState here: eslint forbids it (cascading renders), and it
    // would be redundant anyway. Without a token there is nothing to confirm, and
    // every path that clears the token — logout() and the .catch below — already
    // resets `user` and `loading` itself.
    if (!token) {
      return undefined
    }

    let cancelled = false

    authService
      .me(token)
      .then((me) => {
        if (!cancelled) {
          setUser(me)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          clearStoredToken()
          setToken(null)
          setUser(null)
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [token])

  const acceptSession = useCallback((data) => {
    writeStoredToken(data.token)
    setToken(data.token)
    setUser(data.user)
    setClaimedRounds(data.claimed_rounds)

    return data
  }, [])

  const login = useCallback(
    async (username, password) =>
      acceptSession(
        await authService.login({ username, password, session_id: getOrCreateSessionId() })
      ),
    [acceptSession]
  )

  const register = useCallback(
    async (username, password) =>
      acceptSession(
        await authService.register({ username, password, session_id: getOrCreateSessionId() })
      ),
    [acceptSession]
  )

  // Client-side only: there is no revocation endpoint, and the token expires in
  // seven days. The session id is deliberately left alone, so rounds played after
  // logging out are anonymous again and claimable by whoever signs in next.
  const logout = useCallback(() => {
    clearStoredToken()
    setToken(null)
    setUser(null)
    setClaimedRounds(null)
    // Logging out mid-confirmation cancels the in-flight me(), so nothing else
    // would ever flip `loading` back off.
    setLoading(false)
  }, [])

  const clearClaimedRounds = useCallback(() => setClaimedRounds(null), [])

  return (
    <AuthContext.Provider
      value={{ user, token, loading, claimedRounds, login, register, logout, clearClaimedRounds }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export { AUTH_STORAGE_KEY }
