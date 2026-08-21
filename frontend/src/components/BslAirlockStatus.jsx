import { useTranslation } from '../i18n/context'

// Deliberately separate from BslChecklist: a missing glove and an open
// airlock door are different kinds of problem (one is "put this on", the
// other is "this whole room is not procedurally ready yet"), and mixing them
// into one list buried the door/ventilation blockers among equipment rows.
function BslAirlockStatus({ roomKey, doorOpen, ventilationConnected, suppressed }) {
  const { t } = useTranslation()

  if (!roomKey || suppressed || (roomKey !== 'BSL-3' && roomKey !== 'BSL-4')) {
    return null
  }

  const rows = []

  if (doorOpen?.[roomKey]) {
    rows.push(t('bslAirlock.doorOpen'))
  }
  if (roomKey === 'BSL-4' && !ventilationConnected) {
    rows.push(t('bslAirlock.ventilationOff'))
  }

  if (rows.length === 0) {
    return null
  }

  return (
    <div className="bsl-airlock-status" data-testid="bsl-airlock-status" role="status" aria-live="polite">
      {rows.map((text) => (
        <div key={text} className="bsl-airlock-status__row">{text}</div>
      ))}
    </div>
  )
}

export default BslAirlockStatus
