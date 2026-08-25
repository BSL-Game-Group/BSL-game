import { useTranslation } from '../i18n/context'

// The persistent counterpart to ObjectiveToast: shown only once the player
// has been stuck on the same objective long enough to reach 'verbal', per
// the decision that this row must not compete for attention during normal
// play. Pinned to the bottom of the screen so it never overlaps the toast
// at the top.
//
// Carries no skip control: this row is shown to every player, including one
// on their tenth microbe, so a "skip the guidance" button here would offer to
// turn off something that is already only appearing because they are stuck.
// The offer belongs with the first-round toast, which is the guidance a
// returning player would actually want gone.
function NextStepHud({ objective, roomLabel, stage }) {
  const { t } = useTranslation()

  if (!objective || stage !== 'verbal') {
    return null
  }

  const text = t(`objective.${objective.id}`).replace('{room}', roomLabel ?? '')

  return (
    <div className="next-step-hud" data-testid="next-step-hud" role="status" aria-live="polite">
      <span>{text}</span>
    </div>
  )
}

export default NextStepHud
