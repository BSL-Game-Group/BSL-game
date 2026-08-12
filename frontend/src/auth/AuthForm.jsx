import { useState } from 'react'
import { useAuth } from './context'
import { useTranslation } from '../i18n/context'

const KNOWN_ERROR_CODES = [
  'username_invalid',
  'password_too_short',
  'username_taken',
  'invalid_credentials',
  'rate_limited',
]

// Shared by the top-right HUD panel and the end-of-round popup, which can both be
// mounted at once — hence idPrefix. Two inputs with the same id would break label
// association for a screen reader and make getByLabelText ambiguous in tests.
function AuthForm({ idPrefix, onSuccess }) {
  const { login, register } = useAuth()
  const { t } = useTranslation()

  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorCode, setErrorCode] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const isLogin = mode === 'login'

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setErrorCode(null)

    try {
      const result = await (isLogin ? login(username, password) : register(username, password))

      setUsername('')
      setPassword('')
      onSuccess?.(result)
    } catch (error) {
      setErrorCode(KNOWN_ERROR_CODES.includes(error.code) ? error.code : 'network')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label className="form-label mb-0" htmlFor={`${idPrefix}-username`}>
        {t('auth.usernameLabel')}
      </label>
      <input
        id={`${idPrefix}-username`}
        className="form-control form-control-sm mb-2"
        value={username}
        autoComplete="username"
        onChange={(event) => setUsername(event.target.value)}
      />

      <label className="form-label mb-0" htmlFor={`${idPrefix}-password`}>
        {t('auth.passwordLabel')}
      </label>
      <input
        id={`${idPrefix}-password`}
        className="form-control form-control-sm mb-2"
        type="password"
        value={password}
        autoComplete={isLogin ? 'current-password' : 'new-password'}
        onChange={(event) => setPassword(event.target.value)}
      />

      {!isLogin && <p className="auth-form__note">{t('auth.noRecovery')}</p>}

      {errorCode && (
        <p className="auth-form__error" role="alert">
          {t(`auth.errors.${errorCode}`)}
        </p>
      )}

      <div className="d-flex flex-column align-items-start gap-1">
        <button className="btn btn-sm btn-success" type="submit" disabled={submitting}>
          {submitting
            ? t('auth.working')
            : isLogin
              ? t('auth.submitLogin')
              : t('auth.submitRegister')}
        </button>

        <button
          className="btn btn-sm btn-link p-0"
          type="button"
          onClick={() => {
            setMode(isLogin ? 'register' : 'login')
            setErrorCode(null)
          }}
        >
          {isLogin ? t('auth.switchToRegister') : t('auth.switchToLogin')}
        </button>
      </div>
    </form>
  )
}

export default AuthForm
