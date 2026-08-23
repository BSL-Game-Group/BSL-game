import { CATEGORY_IDS, EQUIPMENT_CATEGORIES } from './equipmentCategories'

const BSL_EQUIPMENT_RULES = {
  1: {
    required: ['lab_coat', 'glasses'],
    anyOf: [
      {
        allOf: [
          { anyOf: ['indoor_shoes', 'disposable_foot_covers'] },
          { anyOf: ['gloves', 'gloves_2'] },
        ],
      },
    ],
    optional: [],
  },
  2: {
    required: ['lab_coat', 'gloves'],
    anyOf: [
      {
        allOf: [
          { anyOf: ['mask', 'face_shield'] },
          { anyOf: ['indoor_shoes', 'disposable_foot_covers'] },
        ],
      },
    ],
    optional: [],
  },
  3: {
    required: ['gloves', 'gloves_2'],
    anyOf: [
      {
        allOf: [
          { anyOf: ['closable_lab_coat', 'disposable_overall'] },
          {
            anyOf: [
              { allOf: ['mask', { anyOf: ['glasses', 'face_shield'] }] },
              'bsl3_respirator',
            ],
          },
          { anyOf: ['indoor_shoes', 'disposable_foot_covers'] },
        ],
      },
    ],
    optional: [],
  },
  4: { required: ['pressurized_suit', 'gloves'], anyOf: [], optional: [] },
}

export function getEquipmentRulesForBslLevel(level) {
  return BSL_EQUIPMENT_RULES[level] ?? { required: [], anyOf: [], optional: [] }
}

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

export function evaluateEquipmentSlots(rules = {}, chosenEquipment = []) {
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

export function evaluateEquipmentRules(rules = {}, chosenEquipment = []) {
  return evaluateEquipmentSlots(rules, chosenEquipment).wrongCount === 0
}
