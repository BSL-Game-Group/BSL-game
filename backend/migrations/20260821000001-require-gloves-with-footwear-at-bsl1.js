'use strict';

// 20260819213443 wrote BSL-1's gloves and footwear as a flat `anyOf`, which the
// evaluator reads as alternative branches: lab coat + glasses + gloves + shoes came
// out WRONG, with the gloves counted as an extra. The other levels already spell a
// "both of these" requirement as `anyOf: [{ allOf: [...] }]`, so BSL-1 says it that
// way here too. All four levels are written out so this migration alone states the
// whole ruleset, whichever earlier ones a database has seen.
const CANONICAL_RULES = {
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
};

async function applyRules(queryInterface, rulesByClass) {
  for (const [classNumber, equipment] of Object.entries(rulesByClass)) {
    await queryInterface.bulkUpdate(
      'bsl_classes',
      { required_equipment: equipment },
      { class_number: Number(classNumber) }
    );
  }
}

module.exports = {
  async up(queryInterface) {
    await applyRules(queryInterface, CANONICAL_RULES);
  },

  // Read from the migration it supersedes rather than copied, because an applied
  // migration cannot change.
  async down(queryInterface) {
    const {
      CANONICAL_RULES: rulesWithFlatBsl1,
    } = require('./20260819213443-update-canonical-equipment-rules');

    await applyRules(queryInterface, rulesWithFlatBsl1);
  },
};

module.exports.CANONICAL_RULES = CANONICAL_RULES;