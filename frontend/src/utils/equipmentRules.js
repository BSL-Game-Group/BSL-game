const BSL_EQUIPMENT_RULES = {
  1: { required: ['lab_coat', 'glasses'], anyOf: [], optional: [] },
  2: { required: ['lab_coat', 'gloves'], anyOf: ['mask', 'face_shield'], optional: [] },
  3: {
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
  },
  4: { required: ['pressurized_suit', 'gloves'], anyOf: [], optional: [] },
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
