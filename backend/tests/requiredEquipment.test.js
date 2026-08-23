const { test, after } = require('node:test');
const assert = require('node:assert');

const db = require('../models');
const { closeDb } = require('./helpers/db');

after(closeDb);

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

test('the seeder and the latest rules migration produce identical rules', () => {
  const { REQUIRED_EQUIPMENT } = require('../seeders/20260622000001-seed-bsl-classes');
  const {
    CANONICAL_RULES: migrationRules,
  } = require('../migrations/20260821000001-require-gloves-with-footwear-at-bsl1');

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
