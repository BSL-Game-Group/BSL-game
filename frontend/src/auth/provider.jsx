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

  useEffect(() => {
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

  const logout = useCallback(() => {
    clearStoredToken()
    setToken(null)
    setUser(null)
    setClaimedRounds(null)
    setLoading(false)
  }, [])

  const removeAccount = useCallback(async () => {
    if (!token) {return}
    await authService.remove(token)
    logout()
    window.dispatchEvent(new Event('game-reset-state'))
  }, [token, logout])

  const clearClaimedRounds = useCallback(() => setClaimedRounds(null), [])

  return (
    <AuthContext.Provider
      value={{ user, token, loading, claimedRounds, login, register, logout, removeAccount, clearClaimedRounds }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export { AUTH_STORAGE_KEY }