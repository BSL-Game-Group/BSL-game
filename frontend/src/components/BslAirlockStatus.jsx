import { useTranslation } from '../i18n/context'

// Covers only what the room itself blocks — an open airlock door or missing
// ventilation — not the player's equipment. Missing gear is left to the
// graded attempt: "this whole room is not procedurally ready yet" is a
// different kind of problem from "put this on", and the equipment checklist
// that used to sit beside this one was removed as too much hand-holding.
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
