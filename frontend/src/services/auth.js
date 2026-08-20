import axios from 'axios'

const rootURL = '/api/auth'

// The server picks the message the player sees by returning a stable `code`; the
// component maps it to a translation key. `error` is developer-facing only.
export class AuthError extends Error {
  constructor(code, status, message) {
    super(message ?? code)
    this.name = 'AuthError'
    this.code = code
    this.status = status
  }
}

const asAuthError = (error) => {
  const data = error?.response?.data

  return new AuthError(
    data?.code ?? 'network',
    error?.response?.status ?? 0,
    data?.error ?? 'Could not reach the server'
  )
}

const register = async ({ username, password, session_id }) => {
  try {
    const response = await axios.post(`${rootURL}/register`, { username, password, session_id })
    return response.data
  } catch (error) {
    throw asAuthError(error)
  }
}

const login = async ({ username, password, session_id }) => {
  try {
    const response = await axios.post(`${rootURL}/login`, { username, password, session_id })
    return response.data
  } catch (error) {
    throw asAuthError(error)
  }
}

const me = async (token) => {
  try {
    const response = await axios.get(`${rootURL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data
  } catch (error) {
    throw asAuthError(error)
  }
}
const remove = async (token) => {
  try {
    const response = await axios.delete(`${rootURL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data
  } catch (error) {
    throw asAuthError(error)
  }
}

export default { register, login, me, remove }

