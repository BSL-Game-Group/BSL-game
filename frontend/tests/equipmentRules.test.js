import {
  evaluateEquipmentRules,
  evaluateEquipmentSlots,
  getEquipmentRulesForBslLevel,
} from '../src/utils/equipmentRules'
import { EQUIPMENT_CONFIG } from '../src/components/ClosetPopup/ItemConfig'

function equipmentIdsIn(rule) {
  if (typeof rule === 'string') {
    return [rule]
  }

  if (Array.isArray(rule)) {
    return rule.flatMap(equipmentIdsIn)
  }

  if (!rule || typeof rule !== 'object') {
    return []
  }

  return [rule.required, rule.anyOf, rule.optional, rule.allOf].flatMap((branch) =>
    branch === undefined ? [] : equipmentIdsIn(branch)
  )
}

describe('evaluateEquipmentRules', () => {
  test('treats anyOf entries as alternative equipment requirements', () => {
    const rules = {
      required: ['gloves'],
      anyOf: ['mask', 'face_shield'],
      optional: [],
    }

    expect(evaluateEquipmentRules(rules, ['gloves', 'mask'])).toBe(true)
    expect(evaluateEquipmentRules(rules, ['gloves', 'face_shield'])).toBe(true)
    expect(evaluateEquipmentRules(rules, ['gloves'])).toBe(false)
  })

  test('supports nested anyOf and allOf equipment groups', () => {
    const rules = {
      required: ['gloves'],
      anyOf: [
        { anyOf: ['closable_lab_coat', 'disposable_overall'] },
        {
          anyOf: [
            { allOf: ['mask', { anyOf: ['glasses', 'face_shield'] }] },
            'respirator',
          ],
        },
      ],
      optional: [],
    }

    expect(evaluateEquipmentRules(rules, ['gloves', 'closable_lab_coat'])).toBe(true)
    expect(evaluateEquipmentRules(rules, ['gloves', 'mask', 'glasses'])).toBe(true)
    expect(evaluateEquipmentRules(rules, ['gloves', 'mask'])).toBe(false)
  })

  test('derives equipment rules from the selected BSL room level', () => {
    const rules = getEquipmentRulesForBslLevel(2)

    expect(evaluateEquipmentRules(rules, ['lab_coat', 'gloves', 'mask', 'indoor_shoes'])).toBe(true)
    expect(evaluateEquipmentRules(rules, ['lab_coat', 'gloves'])).toBe(false)
  })

  test('BSL-1 requires a lab coat, glasses, gloves and footwear', () => {
    expect(getEquipmentRulesForBslLevel(1)).toEqual({
      required: ['lab_coat', 'glasses', 'gloves'],
      anyOf: ['indoor_shoes', 'disposable_foot_covers'],
      optional: [],
    })

    const rules = getEquipmentRulesForBslLevel(1)

    expect(evaluateEquipmentRules(rules, ['lab_coat', 'glasses'])).toBe(false)
    expect(evaluateEquipmentRules(rules, ['lab_coat', 'glasses', 'gloves'])).toBe(false)
    expect(
      evaluateEquipmentRules(rules, ['lab_coat', 'glasses', 'gloves', 'indoor_shoes'])
    ).toBe(true)
    expect(
      evaluateEquipmentRules(rules, ['lab_coat', 'glasses', 'gloves', 'disposable_foot_covers'])
    ).toBe(true)
  })

  test('BSL-2 and BSL-3 need footwear on top of their other choices', () => {
    const bsl2 = getEquipmentRulesForBslLevel(2)

    expect(evaluateEquipmentRules(bsl2, ['lab_coat', 'gloves', 'mask'])).toBe(false)
    expect(evaluateEquipmentRules(bsl2, ['lab_coat', 'gloves', 'mask', 'indoor_shoes'])).toBe(true)

    const bsl3 = getEquipmentRulesForBslLevel(3)
    const bsl3Base = ['gloves', 'gloves_2', 'closable_lab_coat', 'bsl3_respirator']

    expect(evaluateEquipmentRules(bsl3, bsl3Base)).toBe(false)
    expect(evaluateEquipmentRules(bsl3, [...bsl3Base, 'disposable_foot_covers'])).toBe(true)
  })

  test('BSL-3 needs body covering and face protection, not just one of them', () => {
    const bsl3 = getEquipmentRulesForBslLevel(3)
    const gloves = ['gloves', 'gloves_2', 'disposable_foot_covers']

    expect(evaluateEquipmentRules(bsl3, [...gloves, 'disposable_overall'])).toBe(false)
    expect(evaluateEquipmentRules(bsl3, [...gloves, 'bsl3_respirator'])).toBe(false)
    expect(
      evaluateEquipmentRules(bsl3, [...gloves, 'disposable_overall', 'bsl3_respirator'])
    ).toBe(true)
  })

  test('every equipment id in the rules is a real closet item', () => {
    const ids = [1, 2, 3, 4].flatMap((level) => equipmentIdsIn(getEquipmentRulesForBslLevel(level)))

    expect(ids.length).toBeGreaterThan(0)

    for (const id of ids) {
      expect(EQUIPMENT_CONFIG).toHaveProperty(id)
    }
  })

  test('BSL-4 needs no footwear, because the suit covers the feet', () => {
    expect(getEquipmentRulesForBslLevel(4)).toEqual({
      required: ['pressurized_suit', 'gloves'],
      anyOf: [],
      optional: [],
    })
  })
})

describe('evaluateEquipmentSlots', () => {
  const FLAT = { required: ['lab_coat', 'gloves'], anyOf: [], optional: [] }
  const EITHER = { required: [], anyOf: ['mask', 'face_shield'], optional: [] }
  const NESTED = {
    required: ['gloves'],
    anyOf: [
      {
        allOf: [
          { anyOf: ['mask', 'face_shield'] },
          { anyOf: ['indoor_shoes', 'disposable_foot_covers'] },
        ],
      },
    ],
    optional: [],
  }
  const CHEAPEST = {
    required: ['gloves'],
    anyOf: [{ allOf: ['lab_coat', 'glasses'] }, 'disposable_overall'],
    optional: [],
  }

  const CASES = [
    ['a satisfied ruleset', FLAT, ['lab_coat', 'gloves'], 0, {}],
    ['a missing item', FLAT, ['gloves'], 1, { body: { missing: ['lab_coat'], extra: [] } }],
    [
      'unnamed gear',
      FLAT,
      ['lab_coat', 'gloves', 'sunglasses'],
      1,
      { eyewear: { missing: [], extra: ['sunglasses'] } },
    ],
    [
      'a swap inside one category',
      FLAT,
      ['disposable_overall', 'gloves'],
      1,
      { body: { missing: ['lab_coat'], extra: ['disposable_overall'] } },
    ],
    ['a tie, resolved to the first branch', EITHER, [], 1,
      { masks: { missing: ['mask'], extra: [] } }],
    ['both alternatives worn', EITHER, ['mask', 'face_shield'], 1,
      { eyewear: { missing: [], extra: ['face_shield'] } }],
    ['the branch leaving fewest wrong', CHEAPEST, ['gloves'], 1,
      { body: { missing: ['disposable_overall'], extra: [] } }],
    ['a nested allOf, satisfied', NESTED, ['gloves', 'mask', 'indoor_shoes'], 0, {}],
    ['a nested allOf, other arm', NESTED,
      ['gloves', 'face_shield', 'disposable_foot_covers'], 0, {}],
    ['a bare nested array', { required: [], anyOf: [['mask', 'face_shield']], optional: [] },
      ['mask'], 0, {}],
    ['an unknown id in the outfit', FLAT, ['lab_coat', 'gloves', 'sombrero'], 0, {}],
    // A key inherited from Object.prototype is not a category, so it must be ignored the
    // same way 'sombrero' is rather than resolving to something truthy.
    ['a prototype key in the outfit', FLAT, ['lab_coat', 'gloves', 'constructor'], 0, {}],
    // `optional` is inert: the field is ignored, so anything in it counts as an extra.
    [
      'gear listed as optional',
      { required: ['gloves'], anyOf: [], optional: ['lab_coat'] },
      ['gloves', 'lab_coat'],
      1,
      { body: { missing: [], extra: ['lab_coat'] } },
    ],
    // Arrives over HTTP on the server, so a non-array must grade as nothing worn.
    [
      'a non-array outfit',
      FLAT,
      42,
      2,
      { body: { missing: ['lab_coat'], extra: [] }, gloves: { missing: ['gloves'], extra: [] } },
    ],
    ['an empty ruleset', { required: [], anyOf: [], optional: [] }, [], 0, {}],
  ]

  test.each(CASES)('%s', (_label, rules, outfit, wrongCount, overrides) => {
    const { slots, wrongCount: actual } = evaluateEquipmentSlots(rules, outfit)

    expect(actual).toBe(wrongCount)
    expect(Object.keys(slots).sort()).toEqual(['body', 'eyewear', 'footwear', 'gloves', 'masks'])

    for (const id of Object.keys(slots)) {
      expect(slots[id]).toEqual(
        overrides[id]
          ? { status: 'wrong', ...overrides[id] }
          : { status: 'ok', missing: [], extra: [] }
      )
    }

    expect(evaluateEquipmentRules(rules, outfit)).toBe(wrongCount === 0)
  })

  test('rules naming gear the closet does not have cannot be satisfied', () => {
    const { slots, wrongCount } = evaluateEquipmentSlots(
      { required: ['respirator'], anyOf: [], optional: [] },
      ['respirator']
    )

    expect(wrongCount).toBe(5)
    for (const slot of Object.values(slots)) {
      expect(slot).toEqual({ status: 'wrong', missing: [], extra: [] })
    }

    // A prototype key is no more a real item than 'respirator' is.
    expect(
      evaluateEquipmentSlots({ required: ['constructor'], anyOf: [] }, ['constructor']).wrongCount
    ).toBe(5)
  })
})
