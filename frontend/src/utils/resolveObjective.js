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

  // dressingRoom, not showerRoom: setupUndressPoint puts the wash-up spot
  // inside ppeRoomZone and both quick-undress dispatchers are dressing-room
  // only. The one shower on the map is in the BSL-4 airlock, so naming it
  // sent a stuck player to the wrong side of the building.
  if (progress.awaitingUndress) {
    return { id: 'wash-up', target: 'dressingRoom' }
  }

  // Reading the card comes before the closet on purpose. The equipment follows
  // from the organism's BSL level, so a player who dresses first is guessing;
  // the objective should not walk them into that.
  if (!progress.microbeChecked) {
    return { id: 'check-microbe', target: 'lectureRoom' }
  }

  // wrongCount, not missing.length: a player wearing everything required plus
  // one item that does not belong has nothing missing but still fails grading.
  // Reading only `missing` sent them on to handle the microbe and then marked
  // them wrong — the guidance and the grader disagreeing in exactly the case
  // someone needs the guidance for.
  const { missing, wrongCount } = equipmentGap(microbe.bsl_level, equipped)
  if (wrongCount > 0) {
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

// The whole verdict for one outfit: how many categories are wrong (missing an
// item or carrying one that does not belong) and which items are missing, in
// category order.
export function equipmentGap(bslLevel, equipped) {
  const chosen = Object.entries(equipped ?? {})
    .filter(([, isEquipped]) => isEquipped)
    .map(([itemId]) => itemId)

  const rules = getEquipmentRulesForBslLevel(bslLevel)
  const { slots, wrongCount } = evaluateEquipmentSlots(rules, chosen)

  return {
    missing: Object.values(slots).flatMap((slot) => slot.missing),
    wrongCount,
  }
}
