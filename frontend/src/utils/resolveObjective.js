import { getEquipmentRulesForBslLevel, evaluateEquipmentSlots } from './equipmentRules'

// Pure function: no Phaser, no DOM, no side effects. Given the same saved-game
// shaped state, it always returns exactly one next step for the player.
//
// state shape (subset of state/savedGame.js's snapshot):
//   progress: { lectureVisited, awaitingUndress, ... }
//   equipped: { [itemId]: boolean }
//   microbe:  { bsl_level, ... } | null
//   room:     string | null   (current room key, e.g. 'BSL-3', 'dressingRoom')
export function resolveObjective({ progress, equipped, microbe, room } = {}) {
  if (!progress?.lectureVisited) {
    return { id: 'visit-lecture', target: 'lectureRoom' }
  }

  if (!microbe) {
    return { id: 'await-microbe', target: null }
  }

  if (progress.awaitingUndress) {
    return { id: 'wash-up', target: 'showerRoom' }
  }

  const missing = missingEquipment(microbe.bsl_level, equipped)
  if (missing.length > 0) {
    return { id: 'suit-up', target: 'dressingRoom', missing }
  }

  const bslRoom = bslRoomFor(microbe)
  if (room !== bslRoom) {
    return { id: 'go-to-room', target: bslRoom }
  }

  return { id: 'handle-microbe', target: bslRoom }
}

export function bslRoomFor(microbe) {
  return `BSL-${microbe.bsl_level}`
}

// Flattens the per-category slot result from evaluateEquipmentSlots into one
// list of missing item ids, in category order — the same order the BSL
// checklist (Vaihe 4) will want to render them.
export function missingEquipment(bslLevel, equipped) {
  const chosen = Object.entries(equipped ?? {})
    .filter(([, isEquipped]) => isEquipped)
    .map(([itemId]) => itemId)

  const rules = getEquipmentRulesForBslLevel(bslLevel)
  const { slots } = evaluateEquipmentSlots(rules, chosen)

  return Object.values(slots).flatMap((slot) => slot.missing)
}
