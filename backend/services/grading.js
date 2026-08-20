// A port of evaluateEquipmentRules from frontend/src/utils/equipmentRules.js. The
// rules themselves come from bsl_classes.required_equipment, so this file knows
// how to read a rule tree but not what any level requires.
//
// It must stay behaviourally identical to that client function: the player is told
// whether they are right by the client and graded here, so any divergence shows up
// as the game calling an answer correct and the server disagreeing.
// Duplicated from frontend/src/utils/equipmentCategories.js: the backend has no equipment
// model, and each Docker image copies only its own subtree. equipmentSlotsParity.spec.ts is
// what keeps this copy and the evaluator below honest.
const EQUIPMENT_CATEGORIES = {
  lab_coat: 'body',
  closable_lab_coat: 'body',
  pressurized_suit: 'body',
  disposable_overall: 'body',
  mask: 'masks',
  bsl3_respirator: 'masks',
  glasses: 'eyewear',
  sunglasses: 'eyewear',
  face_shield: 'eyewear',
  wow_helmet: 'eyewear',
  gloves: 'gloves',
  gloves_2: 'gloves',
  indoor_shoes: 'footwear',
  disposable_foot_covers: 'footwear',
}

const CATEGORY_IDS = ['eyewear', 'masks', 'body', 'gloves', 'footwear']

// Depth-first, left-to-right, earlier positions varying slowest. The order is contractual:
// client and server must break ties identically or the popup and the scoreboard disagree.
function expand(rule) {
  if (typeof rule === 'string') { return [[rule]] }
  if (Array.isArray(rule)) { return rule.flatMap(expand) }
  if (!rule || typeof rule !== 'object') { return [] }
  if (Array.isArray(rule.anyOf)) { return rule.anyOf.flatMap(expand) }
  if (Array.isArray(rule.allOf)) {
    return rule.allOf.reduce(
      (outfits, part) => outfits.flatMap((worn) => expand(part).map((add) => [...worn, ...add])),
      [[]]
    )
  }
  return []
}

// Own-property only: 'constructor' and friends would otherwise resolve to something
// truthy off Object.prototype and be treated as a category.
function categoryOf(item) {
  return Object.hasOwn(EQUIPMENT_CATEGORIES, item) ? EQUIPMENT_CATEGORIES[item] : undefined
}

function candidateOutfits(rules) {
  const required = Array.isArray(rules?.required) ? rules.required : []
  const anyOf = Array.isArray(rules?.anyOf) ? rules.anyOf : []
  const branches = anyOf.length === 0 ? [[]] : anyOf.flatMap(expand)

  return branches
    .map((branch) => [...required, ...branch])
    .filter((outfit) => outfit.every((item) => categoryOf(item)))
    .map((outfit) => new Set(outfit))
}

function blankSlots(status) {
  return Object.fromEntries(CATEGORY_IDS.map((id) => [id, { status, missing: [], extra: [] }]))
}

function compareOutfit(expected, chosen) {
  const slots = blankSlots('ok')

  for (const item of expected) {
    if (!chosen.has(item)) { slots[categoryOf(item)].missing.push(item) }
  }

  // Unknown ids can only come from a tampered client, and no row could show them.
  for (const item of chosen) {
    const category = categoryOf(item)
    if (category && !expected.has(item)) { slots[category].extra.push(item) }
  }

  let wrongCount = 0

  for (const id of CATEGORY_IDS) {
    if (slots[id].missing.length || slots[id].extra.length) {
      slots[id].status = 'wrong'
      wrongCount += 1
    }
  }

  return { slots, wrongCount }
}

function evaluateEquipmentSlots(rules = {}, chosenEquipment = []) {
  // The array check is deliberate: on the server this arrives over HTTP from a player, and
  // a bare string would otherwise become a Set of its characters.
  const chosen = new Set(Array.isArray(chosenEquipment) ? chosenEquipment : [])
  const candidates = candidateOutfits(rules)

  if (candidates.length === 0) {
    return { slots: blankSlots('wrong'), wrongCount: CATEGORY_IDS.length }
  }

  let best = null

  for (const expected of candidates) {
    const result = compareOutfit(expected, chosen)
    if (best === null || result.wrongCount < best.wrongCount) { best = result }
  }

  return best
}

function evaluateEquipmentRules(rules = {}, chosenEquipment = []) {
  return evaluateEquipmentSlots(rules, chosenEquipment).wrongCount === 0
}

// `rules` is the requirement set for the level the player CHOSE, matching what the
// client shows them while they play (App.jsx grades the same way). Picking the
// wrong room and dressing correctly for it costs the level, not the equipment.
function gradeAnswer(answer, microbe, rules) {
  const equipment = evaluateEquipmentSlots(rules, answer.chosen_equipment)

  return {
    level_correct: Number(answer.chosen_level) === Number(microbe.bsl_level),
    equipment_correct: equipment.wrongCount === 0,
    equipment_slots: equipment.slots,
    equipment_wrong_count: equipment.wrongCount,
  }
}

module.exports = { evaluateEquipmentRules, evaluateEquipmentSlots, gradeAnswer }
