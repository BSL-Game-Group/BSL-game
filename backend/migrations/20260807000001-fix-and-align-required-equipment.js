'use strict';

// Repairs `bsl_classes.required_equipment`, which every existing database holds as
// an empty rule set encoded as a JSONB *string*:
//
//   1. 20260720075658 set the column default with `JSON.stringify(...)`. A JS
//      string handed to Sequelize as a JSONB default becomes a JSON scalar string,
//      not an object.
//   2. That migration's own bulkUpdate ran against an empty table — `db:init` is
//      `db:migrate && db:seed:all`, so migrations always precede seeders — and
//      matched 0 rows.
//   3. The seeder never set the column, so every row took the broken default.
//
// This handles databases that already have rows. Fresh databases are covered by
// 20260622000001-seed-bsl-classes.js, which now inserts the rules directly; a
// migration cannot help there, because the table is still empty at this point.
//
// The rules are duplicated between here and the seeder on purpose: a migration
// must keep doing the same thing forever, so it does not import a shared module
// that a later edit could retroactively change. backend/tests/requiredEquipment.test.js
// is what keeps the two equal to frontend/src/utils/equipmentRules.js.

// Named CANONICAL_RULES, not FRONTEND_RULES: as of 2026-08-07 these are no longer
// a copy of frontend/src/utils/equipmentRules.js. They are what the SERVER grades
// against, and the seeder must produce exactly the same values.
const CANONICAL_RULES = {
  // BSL-1 requires gloves as well as a lab coat and glasses (decided 2026-08-07).
  // NOTE: frontend/src/utils/equipmentRules.js still has only lab_coat + glasses,
  // so the client-side hint and server-side grading disagree until that is
  // updated. Nothing calls the server grader yet, so no player is affected today.
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

// The empty rule set every row currently holds. `down` restores this so the
// migration is a real inverse.
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

// Raw SQL, not changeColumn: the whole bug is that a JS string handed to Sequelize
// as a JSONB default becomes a JSON scalar string. Writing the DDL ourselves
// removes any doubt about what Postgres stores.
//
// The value is written inline rather than interpolated from a variable. It is a
// fixed constant either way, but building DDL by string substitution is a habit
// worth not forming — EMPTY_RULES above is the JS mirror of this literal.
async function setEmptyDefault(queryInterface) {
  await queryInterface.sequelize.query(
    `ALTER TABLE bsl_classes ALTER COLUMN required_equipment SET DEFAULT '{"required": [], "anyOf": [], "optional": []}'::jsonb`
  );
}

module.exports = {
  async up(queryInterface) {
    await applyRules(queryInterface, CANONICAL_RULES);

    // So a future insert that omits the column gets a usable object rather than
    // the malformed string that started all this.
    await setEmptyDefault(queryInterface);
  },

  async down(queryInterface) {
    // WARNING: this restores the exact state that made the original bug invisible.
    // With empty `required` and `anyOf`, evaluateEquipmentRules returns true for
    // every input — so once the server grader is live (Task 18), running this
    // `down` in production marks every equipment answer correct, silently. It is a
    // faithful inverse, which is why it is written this way; do not run it against
    // a live database without also disabling grading.
    await applyRules(
      queryInterface,
      { 1: EMPTY_RULES, 2: EMPTY_RULES, 3: EMPTY_RULES, 4: EMPTY_RULES }
    );

    // Deliberately NOT restoring the malformed string default from 20260720075658.
    // `down` should undo this migration's intent, not reinstate a bug; a correct
    // default is harmless to leave behind.
    await setEmptyDefault(queryInterface);
  },
};

// Exported so backend/tests/requiredEquipment.test.js can assert that this
// migration and the seeder agree. Without it, CI — which always builds a FRESH
// database, where migrations run against an empty table — would never execute or
// verify these values at all, and a migration/seeder drift would ship green.
module.exports.CANONICAL_RULES = CANONICAL_RULES;
