import { useEffect, useRef, useState } from 'react'
import { useTranslation } from '../i18n/context'

const VISIBLE_MS = 3200

// A one-shot notice, not a persistent HUD row: it appears the moment
// resolveObjective's id changes and fades itself out a few seconds later.
// It never fires twice for the same id (no flicker from walking back and
// forth) and never appears while a popup has the game frozen.
function ObjectiveToast({ objective, roomLabel, suppressed }) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)
  const lastIdRef = useRef(null)
  const hideTimerRef = useRef(null)

  useEffect(() => {
    if (!objective || suppressed || objective.id === lastIdRef.current) {
      return
    }

    lastIdRef.current = objective.id
    setVisible(true)

    clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => setVisible(false), VISIBLE_MS)

    return () => clearTimeout(hideTimerRef.current)
  }, [objective, suppressed])

  if (!objective) {
    return null
  }

  const text = t(`objective.${objective.id}`).replace('{room}', roomLabel ?? '')
  // Derived, not a second effect: a popup opening must hide the toast on the
  // very same render, not one render later.
  const isVisible = visible && !suppressed

  return (
    <div
      className={`objective-toast${isVisible ? ' objective-toast--visible' : ''}`}
      role="status"
      aria-live="polite"
    >
      {text}
    </div>
  )
}

export default ObjectiveToast
