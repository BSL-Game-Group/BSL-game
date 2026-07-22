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
