import { useTranslation } from '../i18n/context'
import { EQUIPMENT_CONFIG } from './ClosetPopup/ItemConfig'
import { getEquipmentRulesForBslLevel, evaluateEquipmentSlots } from '../utils/equipmentRules'
import { CATEGORY_IDS } from '../utils/equipmentCategories'

// Shown the moment the player is physically standing in a BSL room, not only
// after they press E and fail — the same missing-item data the failure popup
// would show, just surfaced before the mistake instead of after it. Says
// exactly what's missing (not just a count): the player already loses the
// inference exercise on the graded attempt itself, so hiding it here would
// only cost time, not teach anything extra.
function BslChecklist({ roomKey, equipped, suppressed }) {
  const { t } = useTranslation()

  if (!roomKey || suppressed) {
    return null
  }

  const level = Number(roomKey.replace('BSL-', ''))
  if (!Number.isInteger(level)) {
    return null
  }

  const chosen = Object.keys(equipped ?? {}).filter((id) => equipped[id])
  const rules = getEquipmentRulesForBslLevel(level)
  const { slots, wrongCount } = evaluateEquipmentSlots(rules, chosen)

  if (wrongCount === 0) {
    return null
  }

  const missingRows = CATEGORY_IDS
    .filter((id) => slots[id].missing.length > 0)
    .map((id) => ({
      id,
      items: slots[id].missing.map((itemId) => EQUIPMENT_CONFIG[itemId]?.label ?? itemId),
    }))

  return (
    <div className="bsl-checklist" data-testid="bsl-checklist" role="status" aria-live="polite">
      <div className="bsl-checklist__title">{t('bslChecklist.title').replace('{room}', roomKey)}</div>
      <ul className="bsl-checklist__list">
        {missingRows.map((row) => (
          <li key={row.id} className="bsl-checklist__row">
            <span aria-hidden="true">✗</span> {row.items.join(' / ')}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default BslChecklist
