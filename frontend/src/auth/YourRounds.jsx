import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './context'
import { useTranslation } from '../i18n/context'
import roundsService from '../services/rounds'
import { useModalDialog } from '../hooks/useModalDialog'

function YourRounds() {
  const { token } = useAuth()
  const { t } = useTranslation()

  const [open, setOpen] = useState(false)
  const [rounds, setRounds] = useState([])

  const close = useCallback(() => setOpen(false), [])
  const dialogRef = useModalDialog(open, close)

  useEffect(() => {
    const handler = () => setOpen(true)

    window.addEventListener('your-rounds-opened', handler)
    return () => window.removeEventListener('your-rounds-opened', handler)
  }, [])

  useEffect(() => {
    if (!open || !token) {
      return undefined
    }

    let cancelled = false

    roundsService
      .getMyRounds(token)
      .then((data) => {
        if (!cancelled) {
          setRounds(data)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRounds([])
        }
      })

    return () => {
      cancelled = true
    }
  }, [open, token])

  if (!open) {
    return null
  }

  return (
    <div className="popup-overlay">
      <div
        className="popup-box rounds-panel"
        role="dialog"
        aria-modal="true"
        ref={dialogRef}
        tabIndex={-1}
      >
        <button className="popup-close-button" onClick={close}>
          {t('common.close')}
        </button>

        <h2>{t('auth.rounds.title')}</h2>

        {rounds.length === 0 ? (
          <p>{t('auth.rounds.empty')}</p>
        ) : (
          <table className="table table-sm">
            <thead>
              <tr>
                <th>{t('auth.rounds.score')}</th>
                <th>{t('auth.rounds.correct')}</th>
                <th>{t('auth.rounds.played')}</th>
              </tr>
            </thead>
            <tbody>
              {rounds.map((round) => (
                <tr key={round.id}>
                  <td>{round.score}</td>
                  <td>{`${round.correct_count} / ${round.answer_count}`}</td>
                  <td>{new Date(round.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default YourRounds
