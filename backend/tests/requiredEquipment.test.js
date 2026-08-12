const { test, after } = require('node:test');
const assert = require('node:assert');

const db = require('../models');
const { closeDb } = require('./helpers/db');

after(closeDb);

const CANONICAL_RULES = {
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
