import { useEffect, useRef, useState } from 'react'
import { useTranslation } from '../i18n/context'

const VISIBLE_MS = 3200
// Long enough to notice a button and decide, rather than only long enough to
// read a line of text. Applies whenever the skip control is offered.
const VISIBLE_WITH_SKIP_MS = 7000

// A one-shot notice, not a persistent HUD row: it appears the moment
// resolveObjective's id changes and fades itself out a few seconds later.
// It never fires twice for the same id (no flicker from walking back and
// forth) and never appears while a popup has the game frozen.
//
// This is also where the skip control lives. The toast only ever shows on the
// player's first microbe, which is exactly the guidance someone who already
// knows the loop wants gone — offering it from the stuck row instead meant
// offering it to a player who had just proved they needed it.
function ObjectiveToast({ objective, roomLabel, suppressed, onSkipGuide }) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)
  const lastIdRef = useRef(null)
  // A boolean, not the callback itself: the callback is a new arrow on every
  // render, and a dependency that changes every render is exactly what broke
  // the timer below. Whether a skip is offered changes at most once.
  const offersSkip = Boolean(onSkipGuide)

  // Depends on the id, not the objective: resolveObjective builds a fresh
  // object every render, and the stuck timer re-renders App twice a second.
  // With the object as a dependency the effect re-ran on every tick, its
  // cleanup cleared the pending hide, and the guard below then returned
  // before setting a new one — so the toast stayed on screen for good.
  const objectiveId = objective?.id ?? null

  // Deliberately not gated on `suppressed`. A popup opening mid-display used to
  // re-run this effect: the cleanup cleared the pending hide and the guard
  // returned before arming a new one, so closing the popup on the same
  // objective left the toast — and its clickable skip button — pinned over the
  // game for the rest of that objective. The clock now runs regardless, and
  // the render below is what hides the toast while a popup is up.
  useEffect(() => {
    if (!objectiveId || objectiveId === lastIdRef.current) {
      return
    }

    lastIdRef.current = objectiveId
    setVisible(true)

    const timer = setTimeout(
      () => setVisible(false),
      offersSkip ? VISIBLE_WITH_SKIP_MS : VISIBLE_MS
    )

    return () => clearTimeout(timer)
  }, [objectiveId, offersSkip])

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
      <span>{text}</span>
      {/* Rendered only while actually visible: the faded-out toast stays in the
          DOM at opacity 0, and a button in it would still take clicks. */}
      {offersSkip && isVisible && (
        <button
          type="button"
          className="objective-toast__skip"
          data-testid="objective-toast-skip"
          onClick={onSkipGuide}
        >
          {t('objective.skipGuide')}
        </button>
      )}
    </div>
  )
}

export default ObjectiveToast
