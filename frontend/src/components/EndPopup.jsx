import { useState } from 'react'
import { useAuth } from '../auth/context'
import AuthForm from '../auth/AuthForm'
import { useTranslation } from '../i18n/context'

function EndPopup({ open, round, onKeepPlaying, onExit }) {
  const { user, claimedRounds } = useAuth()
  const { t } = useTranslation()

  const [formOpen, setFormOpen] = useState(false)

  if (!open) {
    return null
  }

  return (
    <div
      className="popup-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="end-popup-title"
    >
      <div className="popup-box end-popup">
        <h2 id="end-popup-title">{round ? t('auth.claim.title') : t('exitConfirm.title')}</h2>

        {round && (
          <p className="end-popup__score">
            {t('auth.claim.scoreLine')
              .replace('{score}', round.score)
              .replace('{total}', round.answer_count)}
          </p>
        )}

        {round && !user && (
          <>
            <p className="end-popup__warning">{t('auth.claim.guestWarning')}</p>

            {formOpen ? (
              <AuthForm idPrefix="end-popup-auth" onSuccess={() => setFormOpen(false)} />
            ) : (
              <button className="btn btn-sm btn-success" onClick={() => setFormOpen(true)}>
                {t('auth.claim.keepScore')}
              </button>
            )}
          </>
        )}

        {round && user && (
          <p className="end-popup__saved">
            {claimedRounds > 0
              ? t('auth.claim.roundsSaved').replace('{count}', claimedRounds)
              : t('auth.claim.savedToAccount')}
          </p>
        )}

        <p>{t('exitConfirm.message')}</p>

        <div className="d-flex gap-2 mt-3">
          <button className="btn btn-outline-secondary" onClick={onKeepPlaying}>
            {t('exitConfirm.no')}
          </button>
          <button className="btn btn-danger" onClick={onExit}>
            {t('exitConfirm.yes')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default EndPopup
