'use strict';

// The PPE rules players are graded against, matching
// frontend/src/utils/equipmentRules.js. They are set here rather than left to the
// column default because migrations run before seeders (`db:init` is
// `db:migrate && db:seed:all`), so on a fresh database no migration can reach
// these rows — the table is still empty when migrations run.
//
// These are serialised with JSON.stringify below, which is required here and
// forbidden elsewhere — the distinction is what caused the original bug:
//
//   * `bulkInsert` is given no column type information, so a plain JS object is
//     rejected outright with "Invalid value {...}". The stringified form is sent
//     as a normal SQL parameter and Postgres parses it into a jsonb OBJECT.
//   * A column DEFAULT is DDL, not a parameter. There Sequelize quotes the JS
//     string as a JSON scalar, producing the malformed jsonb STRING that
//     20260807000001-fix-and-align-required-equipment.js repairs.
//
// backend/tests/requiredEquipment.test.js asserts jsonb_typeof = 'object', so a
// regression to the string form fails loudly instead of silently grading every
// equipment answer as correct.
const REQUIRED_EQUIPMENT = {
  1: { required: ['lab_coat', 'glasses', 'gloves'], anyOf: ['indoor_shoes', 'disposable_foot_covers'], optional: [] },
  2: { required: ['lab_coat', 'gloves'],anyOf: [
    {
      allOf: [
        { anyOf: ['mask', 'face_shield'] },
        { anyOf: ['indoor_shoes', 'disposable_foot_covers'] },
      ],
    },
  ], optional: [] },
  3: {
    required: ['gloves', 'gloves_2'],
    anyOf: [
      {
        allOf: [
          { anyOf: ['closable_lab_coat', 'disposable_overall'] },
          {
            anyOf: [
              { allOf: ['mask', { anyOf: ['glasses', 'face_shield'] }] },
              'respirator',
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

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('bsl_classes', [
      {
        class_number: 1,
        description: 'Minimal risk — basic teaching lab',
        required_equipment: JSON.stringify(REQUIRED_EQUIPMENT[1]),
      },
      {
        class_number: 2,
        description: 'Moderate risk — agents of moderate hazard',
        required_equipment: JSON.stringify(REQUIRED_EQUIPMENT[2]),
      },
      {
        class_number: 3,
        description: 'High risk — aerosol-transmissible agents',
        required_equipment: JSON.stringify(REQUIRED_EQUIPMENT[3]),
      },
      {
        class_number: 4,
        description: 'Extreme risk — dangerous, life-threatening agents',
        required_equipment: JSON.stringify(REQUIRED_EQUIPMENT[4]),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('bsl_classes', null, {});
  },
};

// Exported so backend/tests/requiredEquipment.test.js can assert that this seeder
// and 20260807000001-fix-and-align-required-equipment.js produce identical rules.
// They are duplicated on purpose — a migration must keep doing the same thing
// forever, so it cannot import a shared module — and this is what keeps the
// duplicates honest.
module.exports.REQUIRED_EQUIPMENT = REQUIRED_EQUIPMENT;
