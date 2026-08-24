import { useTranslation } from '../i18n/context'

// Covers what stops the room from being usable right now, not what the player
// should have inferred. The BSL-4 suit belongs here even though it is worn
// gear: the game already refuses entry and handling without it through its own
// popups, so it is a hard gate like the door and the ventilation rather than
// part of the equipment guess the graded attempt tests. The equipment
// checklist that used to sit beside this panel stayed removed for that reason.
//
// Rows follow the order the player has to do them in: suit, gloves,
// ventilation, door. Suit, gloves and ventilation are exactly what
// App.jsx's bsl4Ready gates handling on, so the panel and the refusal can
// never disagree about what is missing.
function BslAirlockStatus({
  roomKey,
  doorOpen,
  ventilationConnected,
  suitOn,
  glovesOn,
  suppressed,
}) {
  const { t } = useTranslation()

  if (!roomKey || suppressed || (roomKey !== 'BSL-3' && roomKey !== 'BSL-4')) {
    return null
  }

  const rows = []

  if (roomKey === 'BSL-4' && !suitOn) {
    rows.push(t('bslAirlock.suitOff'))
  }
  if (roomKey === 'BSL-4' && !glovesOn) {
    rows.push(t('bslAirlock.glovesOff'))
  }
  if (roomKey === 'BSL-4' && !ventilationConnected) {
    rows.push(t('bslAirlock.ventilationOff'))
  }
  if (doorOpen?.[roomKey]) {
    rows.push(t('bslAirlock.doorOpen'))
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
