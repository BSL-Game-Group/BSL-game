import { useEffect, useState } from 'react'
import { useAuth } from './context'
import { useTranslation } from '../i18n/context'
import AuthForm from './AuthForm'

// The only placement-dependent piece of the auth UI. It is an inline panel rather
// than a popup on purpose: with the sidebar gone and the game full-screen, the one
// thing that has to stay reachable at all times is a corner of the viewport, and a
// panel that expands in place never covers the game to ask for a password.
function AuthStatus() {
  const { user, logout } = useAuth()
  const { t } = useTranslation()

  const [formOpen, setFormOpen] = useState(false)

  // The login/register inputs sit right over the game canvas, which still
  // listens for keydown globally — typing something like "e" into a field
  // was also triggering game interactions bound to that key. Reusing the
  // same popup-opened/closed contract other popups use stops the game from
  // reacting to keystrokes while the form has focus.
  useEffect(() => {
    window.dispatchEvent(new Event(formOpen ? 'popup-opened' : 'popup-closed'))
  }, [formOpen])

  if (!user) {
    return (
      <div className="auth-status">
        <div className="d-flex align-items-center gap-2">
          <span className="auth-status__label">{t('auth.guest')}</span>
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={() => setFormOpen((open) => !open)}
          >
            {formOpen ? t('auth.cancel') : t('auth.loginButton')}
          </button>
        </div>

        {formOpen && <AuthForm idPrefix="hud-auth" onSuccess={() => setFormOpen(false)} />}

        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => window.dispatchEvent(new Event('leaderboard-opened'))}
        >
          {t('auth.leaderboard.openButton')}
        </button>
      </div>
    )
  }

  return (
    <div className="auth-status">
      <div className="d-flex align-items-center gap-2">
        <span className="auth-status__label">
          {t('auth.signedInAs').replace('{username}', user.username)}
        </span>
        <button className="btn btn-sm btn-outline-secondary" onClick={logout}>
          {t('auth.logoutButton')}
        </button>
      </div>
      <div className="d-flex gap-2">
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => window.dispatchEvent(new Event('your-rounds-opened'))}
        >
          {t('auth.rounds.openButton')}
        </button>
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => window.dispatchEvent(new Event('leaderboard-opened'))}
        >
          {t('auth.leaderboard.openButton')}
        </button>
      </div>
    </div>
  )
}

export default AuthStatus
