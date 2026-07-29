import { evaluateEquipmentRules, getEquipmentRulesForBslLevel } from '../src/utils/equipmentRules'

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

    expect(evaluateEquipmentRules(rules, ['lab_coat', 'gloves', 'mask'])).toBe(true)
    expect(evaluateEquipmentRules(rules, ['lab_coat', 'gloves'])).toBe(false)
  })
})
