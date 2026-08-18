// A port of evaluateEquipmentRules from frontend/src/utils/equipmentRules.js. The
// rules themselves come from bsl_classes.required_equipment, so this file knows
// how to read a rule tree but not what any level requires.
//
// It must stay behaviourally identical to that client function: the player is told
// whether they are right by the client and graded here, so any divergence shows up
// as the game calling an answer correct and the server disagreeing.
function matchesRule(rule, selected) {
  if (typeof rule === 'string') {
    return selected.has(rule)
  }

  if (Array.isArray(rule)) {
    return rule.some((item) => matchesRule(item, selected))
  }

  if (!rule || typeof rule !== 'object') {
    return false
  }

  if (Array.isArray(rule.anyOf)) {
    return rule.anyOf.some((item) => matchesRule(item, selected))
  }

  if (Array.isArray(rule.allOf)) {
    return rule.allOf.every((item) => matchesRule(item, selected))
  }

  return false
}

function evaluateEquipmentRules(rules, chosenEquipment) {
  // The client builds this Set straight from its argument; here the array check is
  // deliberate, because this input arrives over HTTP from a player. A bare string
  // would otherwise become a Set of its characters.
  const selected = new Set(Array.isArray(chosenEquipment) ? chosenEquipment : [])

  const requiredRules = Array.isArray(rules?.required) ? rules.required : []
  const requiredSatisfied = requiredRules.every((item) => selected.has(item))

  const anyOfRules = Array.isArray(rules?.anyOf) ? rules.anyOf : []
  const anyOfSatisfied = anyOfRules.length === 0 || anyOfRules.some((rule) => matchesRule(rule, selected))

  return requiredSatisfied && anyOfSatisfied
}

function gradeAnswer(answer, microbe, rules) {
  return {
    level_correct: Number(answer.chosen_level) === Number(microbe.bsl_level),
    equipment_correct: evaluateEquipmentRules(rules, answer.chosen_equipment),
    room_attempt: Number(answer.room_attempt || 1),
    equipment_attempt: Number(answer.equipment_attempt || 1),
  }
}

module.exports = { evaluateEquipmentRules, gradeAnswer }
