import { evaluateEquipmentRules, getEquipmentRulesForBslLevel } from '../src/utils/equipmentRules'
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

  test('ignores optional gear when checking correctness', () => {
    const rules = {
      required: ['gloves'],
      anyOf: ['mask', 'face_shield'],
      optional: ['lab_coat'],
    }

    expect(evaluateEquipmentRules(rules, ['gloves', 'mask', 'lab_coat'])).toBe(true)
    expect(evaluateEquipmentRules(rules, ['gloves', 'mask'])).toBe(true)
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
