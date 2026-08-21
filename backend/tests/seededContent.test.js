const { test, describe, after } = require('node:test');
const assert = require('node:assert');

const db = require('../models');
const { closeDb } = require('./helpers/db');
const { fingerprintOf } = require('./helpers/contentFingerprint');

const materialEn = require('../data/bsl_material_en.json');
const materialFi = require('../data/bsl_material_fi.json');
const materialSv = require('../data/bsl_material_sv.json');

const microbesEn = require('../data/microbes_eng_v2.json');
const microbesFi = require('../data/microbes_fin_v2.json');
const microbesSv = require('../data/microbes_swe_v2.json');

after(closeDb);

// Editing a file in backend/data/ reaches a database that has already been
// seeded only through a migration — a seeder runs once and never again. CI
// cannot notice a missing one, because it always builds a fresh database where
// the seeder writes the current files anyway. These two tests are the guard:
// each refresh migration records the fingerprint of the data it copied, so
// changing a data file without adding a migration fails here.
describe('data files cannot change without a migration', () => {
  test('bsl_material data matches the last migration that copied it', () => {
    const {
      DATA_FINGERPRINT,
    } = require('../migrations/20260821000001-refresh-bsl-material-content');

    const actual = fingerprintOf([
      'bsl_material_en.json',
      'bsl_material_fi.json',
      'bsl_material_sv.json',
    ]);

    assert.strictEqual(
      actual,
      DATA_FINGERPRINT,
      'backend/data/bsl_material_*.json changed without a migration to carry it ' +
        'into already-seeded databases. Add a migration like ' +
        '20260821000001-refresh-bsl-material-content.js and set its ' +
        `DATA_FINGERPRINT to:\n  ${actual}`
    );
  });

  test('microbe data matches the last migration that copied it', () => {
    const {
      DATA_FINGERPRINT,
    } = require('../migrations/20260821000002-refresh-microbe-texts');

    const actual = fingerprintOf([
      'microbes_eng_v2.json',
      'microbes_fin_v2.json',
      'microbes_swe_v2.json',
    ]);

    assert.strictEqual(
      actual,
      DATA_FINGERPRINT,
      'backend/data/microbes_*_v2.json changed without a migration to carry it ' +
        'into already-seeded databases. Add a migration like ' +
        '20260821000002-refresh-microbe-texts.js and set its ' +
        `DATA_FINGERPRINT to:\n  ${actual}`
    );
  });
});

// The three language files are joined on id. A duplicate or missing id used to
// shift the join silently and hand 29 microbes another organism's Swedish text.
describe('the microbe language files line up', () => {
  test('every file lists each id exactly once', () => {
    for (const [fileName, microbes] of [
      ['microbes_eng_v2.json', microbesEn],
      ['microbes_fin_v2.json', microbesFi],
      ['microbes_swe_v2.json', microbesSv],
    ]) {
      const ids = microbes.map((microbe) => microbe.id);
      const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);

      assert.deepStrictEqual(duplicates, [], `${fileName} repeats id(s)`);
    }
  });

  test('all three files cover the same ids', () => {
    const idsOf = (microbes) => microbes.map((m) => m.id).sort((a, b) => a - b);

    assert.deepStrictEqual(
      idsOf(microbesFi),
      idsOf(microbesEn),
      'Finnish microbes do not cover the same ids as English'
    );
    assert.deepStrictEqual(
      idsOf(microbesSv),
      idsOf(microbesEn),
      'Swedish microbes do not cover the same ids as English'
    );
  });
});

describe('the database holds what the data files say', () => {
  test('bsl_material content matches the data files', async () => {
    for (const [language, expected] of [
      ['en', materialEn],
      ['fi', materialFi],
      ['sv', materialSv],
    ]) {
      const row = await db.BSLMaterial.findByPk(language);

      assert.ok(row, `bsl_material has no '${language}' row`);
      assert.deepStrictEqual(
        row.content,
        expected,
        `bsl_material.${language} has drifted from its data file`
      );
    }
  });

  // Passing the content as an already-stringified value would store a JSON
  // string rather than an object, and every reader expects an object.
  test('bsl_material content is stored as a JSON object, not a string', async () => {
    const [rows] = await db.sequelize.query(
      'SELECT language, jsonb_typeof(content) AS json_type FROM bsl_material ORDER BY language'
    );

    for (const row of rows) {
      assert.strictEqual(
        row.json_type,
        'object',
        `bsl_material.${row.language} is stored as a JSON ${row.json_type}`
      );
    }
  });

  test('every microbe carries its own translations, not a neighbouring one', async () => {
    const svById = new Map(microbesSv.map((m) => [m.id, m]));
    const fiById = new Map(microbesFi.map((m) => [m.id, m]));

    const microbes = await db.Microbe.findAll({ order: [['id', 'ASC']] });

    assert.strictEqual(microbes.length, microbesEn.length, 'all microbes should be seeded');

    for (const microbe of microbes) {
      assert.strictEqual(
        microbe.common_name_sv,
        svById.get(microbe.id).common_name,
        `microbe ${microbe.id} (${microbe.common_name}) has the wrong Swedish name`
      );
      assert.strictEqual(
        microbe.common_name_fi,
        fiById.get(microbe.id).common_name,
        `microbe ${microbe.id} (${microbe.common_name}) has the wrong Finnish name`
      );
    }
  });

  // The lecture text is the player's only clue for guessing the level, so it
  // must never name it — see 899643f.
  test('no lecture text gives the BSL level away', async () => {
    const microbes = await db.Microbe.findAll();

    for (const microbe of microbes) {
      for (const field of ['lecture_text', 'lecture_text_sv', 'lecture_text_fi']) {
        assert.doesNotMatch(
          microbe[field] ?? '',
          /BSL-\d/,
          `microbe ${microbe.id} (${microbe.common_name}) names its level in ${field}`
        );
      }
    }
  });
});
