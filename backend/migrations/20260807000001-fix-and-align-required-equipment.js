'use strict';

const CANONICAL_RULES = {
  1: { required: ['lab_coat', 'glasses', 'gloves'], anyOf: [], optional: [] },
  2: { required: ['lab_coat', 'gloves'], anyOf: ['mask', 'face_shield'], optional: [] },
  3: {
    required: ['gloves', 'gloves_2'],
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
};

const EMPTY_RULES = { required: [], anyOf: [], optional: [] };

async function applyRules(queryInterface, rulesByClass) {
  for (const [classNumber, equipment] of Object.entries(rulesByClass)) {
    await queryInterface.bulkUpdate(
      'bsl_classes',
      { required_equipment: equipment },
      { class_number: Number(classNumber) }
    );
  }
}

async function setEmptyDefault(queryInterface) {
  await queryInterface.sequelize.query(
    `ALTER TABLE bsl_classes ALTER COLUMN required_equipment SET DEFAULT '{"required": [], "anyOf": [], "optional": []}'::jsonb`
  );
}

module.exports = {
  async up(queryInterface) {
    await applyRules(queryInterface, CANONICAL_RULES);

    await setEmptyDefault(queryInterface);
  },

  async down(queryInterface) {
    await applyRules(
      queryInterface,
      { 1: EMPTY_RULES, 2: EMPTY_RULES, 3: EMPTY_RULES, 4: EMPTY_RULES }
    );

    await setEmptyDefault(queryInterface);
  },
};

module.exports.CANONICAL_RULES = CANONICAL_RULES;
