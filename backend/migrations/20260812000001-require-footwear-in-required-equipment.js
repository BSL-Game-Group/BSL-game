'use strict';

const CANONICAL_RULES = {
  1: {
    required: ['lab_coat', 'glasses', 'gloves'],
    anyOf: ['indoor_shoes', 'disposable_foot_covers'],
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

  // Restores the rules the previous alignment migration left behind, read from that
  // migration rather than copied, because an applied migration cannot change.
  async down(queryInterface) {
    const {
      CANONICAL_RULES: rulesWithoutFootwear,
    } = require('./20260807000001-fix-and-align-required-equipment');

    await applyRules(queryInterface, rulesWithoutFootwear);
  },
};

module.exports.CANONICAL_RULES = CANONICAL_RULES;
