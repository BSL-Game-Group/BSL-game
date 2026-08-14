import { useEffect, useState } from 'react'
import { useTranslation } from '../i18n/context'
import roundsService from '../services/rounds'

function Leaderboard() {
  const { t } = useTranslation()

  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState([])

  useEffect(() => {
    const handler = () => setOpen(true)

    window.addEventListener('leaderboard-opened', handler)
    return () => window.removeEventListener('leaderboard-opened', handler)
  }, [])

  useEffect(() => {
    if (!open) {
      return undefined
    }

    let cancelled = false

    roundsService
      .getLeaderboard()
      .then((data) => {
        if (!cancelled) {
          setEntries(data)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setEntries([])
        }
      })

    return () => {
      cancelled = true
    }
  }, [open])

  if (!open) {
    return null
  }

  return (
    <div className="popup-overlay">
      <div className="popup-box rounds-panel">
        <button className="popup-close-button" onClick={() => setOpen(false)}>
          {t('common.close')}
        </button>

        <h2>{t('auth.leaderboard.title')}</h2>

        {entries.length === 0 ? (
          <p>{t('auth.leaderboard.empty')}</p>
        ) : (
          <table className="table table-sm">
            <thead>
              <tr>
                <th>{t('auth.leaderboard.rank')}</th>
                <th>{t('auth.leaderboard.player')}</th>
                <th>{t('auth.leaderboard.score')}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <tr key={entry.username}>
                  <td>{index + 1}</td>
                  <td>{entry.username}</td>
                  <td>{entry.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default Leaderboard
