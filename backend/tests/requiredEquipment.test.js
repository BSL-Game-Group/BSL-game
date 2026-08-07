const { test, after } = require('node:test');
const assert = require('node:assert');

const db = require('../models');
const { closeDb } = require('./helpers/db');

after(closeDb);

// The canonical PPE rules the server grades against. This is what the seeder and
// 20260807000001-fix-and-align-required-equipment.js must both produce, so if
// either drifts, this test says so.
//
// BSL-1 additionally requires gloves (decided 2026-08-07), which
// frontend/src/utils/equipmentRules.js does NOT yet reflect — so this is no longer
// a literal copy of that file, hence CANONICAL_RULES rather than FRONTEND_RULES.
// Until the frontend is updated, the client-side hint and the server's verdict
// disagree at BSL-1. Nothing calls the server grader yet; reconciling the two is a
// prerequisite for Task 18.
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

test('the database rules match the rules the game grades against', async () => {
  const classes = await db.BSLClass.findAll({ order: [['class_number', 'ASC']] });

  assert.strictEqual(classes.length, 4, 'all four BSL classes should be seeded');

  for (const bslClass of classes) {
    assert.deepStrictEqual(
      bslClass.required_equipment,
      CANONICAL_RULES[bslClass.class_number],
      `BSL-${bslClass.class_number} rules have drifted`
    );
  }
});

// The check above only sees whichever half actually populated this database, and
// CI always builds a FRESH one — where migrations run against an empty table, so
// the migration's values are never executed. Without the two assertions below, a
// migration edited out of step with the seeder would ship green and silently give
// existing databases (dev, and OpenShift `possu`) different rules from new ones.
test('the seeder and the repair migration produce identical rules', () => {
  const { REQUIRED_EQUIPMENT } = require('../seeders/20260622000001-seed-bsl-classes');
  const {
    CANONICAL_RULES: migrationRules,
  } = require('../migrations/20260807000001-fix-and-align-required-equipment');

  assert.deepStrictEqual(
    REQUIRED_EQUIPMENT,
    migrationRules,
    'the seeder (fresh databases) and the migration (existing databases) have drifted apart'
  );
});

test('both halves match what this test asserts against the database', () => {
  const { REQUIRED_EQUIPMENT } = require('../seeders/20260622000001-seed-bsl-classes');

  assert.deepStrictEqual(REQUIRED_EQUIPMENT, CANONICAL_RULES);
});

// The original bug stored the rules as a JSONB *string* rather than an object.
// Sequelize hands a string straight back, evaluateEquipmentRules finds no
// `required` array, and every equipment answer grades as correct — silently. This
// asserts the storage shape at the database level, which the check above cannot.
test('the rules are stored as JSON objects, not JSON strings', async () => {
  const [rows] = await db.sequelize.query(
    'SELECT class_number, jsonb_typeof(required_equipment) AS json_type FROM bsl_classes ORDER BY class_number'
  );

  for (const row of rows) {
    assert.strictEqual(
      row.json_type,
      'object',
      `BSL-${row.class_number} is stored as a JSON ${row.json_type}, not an object`
    );
  }
});
