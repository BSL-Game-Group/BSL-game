'use strict';

const { buildRows } = require('../seeders/20260622000002-seed-microbes');

// Two separate problems reach an already-seeded database only through here:
//
//   * the measles lecture text was corrected from "MMR" to "MPR (MMR)", and
//     899643f rewrote several lecture texts that gave the BSL level away —
//     both edited backend/data/ only, and a seeder never runs twice;
//   * 29 of 60 microbes were seeded with another organism's Swedish name,
//     lecture text and feedback, because the seeder paired the three language
//     files by array index and the Swedish file had a duplicate entry.
//
// Rows come from the seeder's own buildRows(), so a database repaired here and
// a database seeded fresh end up with identical text by construction.
//
// On a fresh database this is a no-op: db:init migrates before it seeds, so the
// table is still empty and every update matches zero rows.
const COLUMNS = [
  'common_name',
  'scientific_name',
  'type',
  'bsl_level',
  'lecture_text',
  'feedback_correct',
  'feedback_incorrect',
  'common_name_sv',
  'type_sv',
  'lecture_text_sv',
  'feedback_correct_sv',
  'feedback_incorrect_sv',
  'common_name_fi',
  'type_fi',
  'lecture_text_fi',
  'feedback_correct_fi',
  'feedback_incorrect_fi',
];

// Guards against another data edit landing without its own migration — see
// tests/helpers/contentFingerprint.js and tests/seededContent.test.js.
const DATA_FINGERPRINT =
  '7954622208855ee8a5af52e408ffe3a27ad07c00234c7a2f7d27ae5efb754658';

module.exports = {
  async up(queryInterface) {
    for (const row of buildRows()) {
      const values = {};

      for (const column of COLUMNS) {
        values[column] = row[column];
      }

      await queryInterface.bulkUpdate('microbes', values, { id: row.id });
    }
  },

  // Deliberately a no-op. The previous text is not recorded anywhere, and
  // restoring it would only put the mismatched Swedish translations and the
  // level-revealing lecture texts back in front of players.
  async down() {},
};

module.exports.DATA_FINGERPRINT = DATA_FINGERPRINT;
