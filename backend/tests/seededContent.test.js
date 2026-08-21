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
// The newest refresh migration for each set of data files. Adding a migration
// means changing the name here too — the failure message below says so, because
// updating only the migration leaves this test comparing against the old one
// and still failing, with no hint as to why.
const LATEST_REFRESH_MIGRATIONS = [
  {
    label: 'bsl_material',
    migration: '20260821000001-refresh-bsl-material-content',
    files: ['bsl_material_en.json', 'bsl_material_fi.json', 'bsl_material_sv.json'],
  },
  {
    label: 'microbe',
    migration: '20260821000002-refresh-microbe-texts',
    files: ['microbes_eng_v2.json', 'microbes_fin_v2.json', 'microbes_swe_v2.json'],
  },
];

describe('data files cannot change without a migration', () => {
  for (const { label, migration, files } of LATEST_REFRESH_MIGRATIONS) {
    test(`${label} data matches the last migration that copied it`, () => {
      const { DATA_FINGERPRINT } = require(`../migrations/${migration}`);
      const actual = fingerprintOf(files);

      assert.strictEqual(
        actual,
        DATA_FINGERPRINT,
        `${files.join(', ')} changed, but ${migration} is still the last ` +
          'migration that copied them into already-seeded databases. Two steps:\n' +
          `  1. add a migration modelled on ${migration}.js, with\n` +
          `     DATA_FINGERPRINT = '${actual}'\n` +
          '  2. name it in LATEST_REFRESH_MIGRATIONS in this file, or this test\n' +
          '     keeps comparing against the old migration and stays red.'
      );
    });
  }
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
      // Looked up rather than dereferenced inline: a missing id would otherwise
      // throw a TypeError that says nothing about which microbe is at fault.
      const sv = svById.get(microbe.id);
      const fi = fiById.get(microbe.id);

      assert.ok(sv, `microbes_swe_v2.json has no microbe with id ${microbe.id}`);
      assert.ok(fi, `microbes_fin_v2.json has no microbe with id ${microbe.id}`);

      assert.strictEqual(
        microbe.common_name_sv,
        sv.common_name,
        `microbe ${microbe.id} (${microbe.common_name}) has the wrong Swedish name`
      );
      assert.strictEqual(
        microbe.common_name_fi,
        fi.common_name,
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
