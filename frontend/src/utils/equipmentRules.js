const BSL_EQUIPMENT_RULES = {
  1: {
      required: ['lab_coat', 'glasses'],
      anyOf: [
        'indoor_shoes',
        'disposable_foot_covers',
        { anyOf: ['gloves', 'gloves_2'] }
      ],
      optional: [],
    },
    2: {
      required: ['lab_coat', 'mask'],
      anyOf: [
        {
          allOf: [
            { anyOf: ['glasses', 'face_shield'] },
            { anyOf: ['gloves', 'gloves_2'] },
            { anyOf: ['indoor_shoes', 'disposable_foot_covers'] },
          ],
        },
      ],
      optional: [],
    },
    3: {
      required: ['disposable_overall', 'mask', 'gloves', 'gloves_2'],
      anyOf: [
        {
          allOf: [
            { anyOf: ['glasses', 'face_shield'] },
            { anyOf: ['indoor_shoes', 'disposable_foot_covers'] },
          ],
        },
      ],
      optional: [],
    },
    4: { required: ['pressurized_suit'], anyOf: ['gloves', 'gloves_2'], optional: [] },
  }

export function getEquipmentRulesForBslLevel(level) {
  return BSL_EQUIPMENT_RULES[level] ?? { required: [], anyOf: [], optional: [] }
}

export function evaluateEquipmentRules(rules = {}, chosenEquipment = []) {
  const selected = new Set(chosenEquipment)

  const matchesRule = (rule) => {
    if (typeof rule === 'string') {
      return selected.has(rule)
    }

    if (Array.isArray(rule)) {
      return rule.some(matchesRule)
    }

    if (!rule || typeof rule !== 'object') {
      return false
    }

    if (Array.isArray(rule.anyOf)) {
      return rule.anyOf.some(matchesRule)
    }

    if (Array.isArray(rule.allOf)) {
      return rule.allOf.every(matchesRule)
    }

    return false
  }

  const requiredRules = Array.isArray(rules?.required) ? rules.required : []
  const requiredSatisfied = requiredRules.every((item) => selected.has(item))

  const anyOfRules = Array.isArray(rules?.anyOf) ? rules.anyOf : []
  const anyOfSatisfied = anyOfRules.length === 0 || anyOfRules.some(matchesRule)

  return requiredSatisfied && anyOfSatisfied
}
