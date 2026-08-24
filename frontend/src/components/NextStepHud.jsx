import { useTranslation } from '../i18n/context'

// The persistent counterpart to ObjectiveToast: shown only once the player
// has been stuck on the same objective long enough to reach 'verbal', per
// the decision that this row must not compete for attention during normal
// play. Pinned to the bottom of the screen so it never overlaps the toast
// at the top.
function NextStepHud({ objective, roomLabel, stage, onSkipGuide }) {
  const { t } = useTranslation()

  if (!objective || stage !== 'verbal') {
    return null
  }

  const text = t(`objective.${objective.id}`).replace('{room}', roomLabel ?? '')

  return (
    <div className="next-step-hud" data-testid="next-step-hud" role="status" aria-live="polite">
      <span>{text}</span>
      {onSkipGuide && (
        <button
          type="button"
          className="next-step-hud__skip"
          data-testid="next-step-hud-skip"
          onClick={onSkipGuide}
        >
          {t('objective.skipGuide')}
        </button>
      )}
    </div>
  )
}

export default NextStepHud
