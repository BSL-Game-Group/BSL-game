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
    for (const [language, content] of Object.entries(CONTENT_BY_LANGUAGE)) {
      await queryInterface.bulkUpdate('bsl_material', { content }, { language });
    }
  },

  // Deliberately a no-op. The previous content is not recorded anywhere, and
  // restoring it would only put known-wrong text back in front of players.
  // Nothing reads this column but the material popup, so there is no schema or
  // data dependency that a rollback would leave inconsistent.
  async down() {},
};

module.exports.DATA_FINGERPRINT = DATA_FINGERPRINT;
