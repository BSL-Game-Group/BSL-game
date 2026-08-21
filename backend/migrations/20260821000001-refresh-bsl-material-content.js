'use strict';

const materialEn = require('../data/bsl_material_en.json');
const materialFi = require('../data/bsl_material_fi.json');
const materialSv = require('../data/bsl_material_sv.json');

// /api/bsl-material serves bsl_material.content straight from the database and
// never reads backend/data/. Those files reach the database only through
// 20260727090001-seed-bsl-material, and a seeder runs exactly once per database
// — so every edit to them since that seeder first ran is still missing from any
// database that was already seeded. This migration carries them across, since a
// migration does run once against every database regardless of seeder history.
//
// On a fresh database this is a no-op: db:init migrates before it seeds, so the
// table is still empty here and the seeder writes the same content moments later.
const CONTENT_BY_LANGUAGE = {
  en: materialEn,
  fi: materialFi,
  sv: materialSv,
};

// Guards against another data edit landing without its own migration — see
// tests/helpers/contentFingerprint.js and tests/seededContent.test.js.
const DATA_FINGERPRINT =
  '25da3a093f406bdd9c886b3f4edc98d4b48c6a6397ae6b23735b1cbe41962f2b';

module.exports = {
  async up(queryInterface) {
    // Insert, not just update: the Swedish row can be missing entirely. The
    // seeder shipped with only 'en' and 'fi' (d37f749) and gained 'sv' hours
    // later in bd87637 — a database seeded in between has no 'sv' row at all,
    // and bulkUpdate alone would leave it that way. /api/bsl-material silently
    // falls back to English for a missing language, so nobody would notice.
    const [rows] = await queryInterface.sequelize.query(
      'SELECT language FROM bsl_material'
    );
    const present = new Set(rows.map((row) => row.language));

    for (const [language, content] of Object.entries(CONTENT_BY_LANGUAGE)) {
      if (present.has(language)) {
        await queryInterface.bulkUpdate('bsl_material', { content }, { language });
      } else {
        await queryInterface.bulkInsert('bsl_material', [
          { language, content: JSON.stringify(content) },
        ]);
      }
    }
  },

  // Deliberately a no-op. The previous content is not recorded anywhere, and
  // restoring it would only put known-wrong text back in front of players.
  // Nothing reads this column but the material popup, so there is no schema or
  // data dependency that a rollback would leave inconsistent.
  async down() {},
};

module.exports.DATA_FINGERPRINT = DATA_FINGERPRINT;
