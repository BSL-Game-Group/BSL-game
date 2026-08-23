'use strict';

const microbesEn = require('../data/microbes_eng_v2.json');
const microbesSv = require('../data/microbes_swe_v2.json');
const microbesFi = require('../data/microbes_fin_v2.json');

// Pairing the three languages by array index assumes all three files list the
// same organisms in the same order — an assumption nothing enforced. A duplicate
// entry in the Swedish file shifted everything after it by one, and 29 of 60
// microbes were seeded with another organism's Swedish name, lecture text and
// feedback. Matching on the id the files already carry cannot drift that way,
// and a missing id now fails loudly instead of silently seeding the wrong text.
function indexById(microbes) {
  return new Map(microbes.map((microbe) => [microbe.id, microbe]));
}

const svById = indexById(microbesSv);
const fiById = indexById(microbesFi);

function translationFor(byId, id, fileName) {
  const microbe = byId.get(id);

  if (!microbe) {
    throw new Error(`${fileName} has no microbe with id ${id}`);
  }

  return microbe;
}

// Exported so the migration that repairs already-seeded databases builds its
// rows from this exact function. A fresh database and an existing one then
// cannot end up with different text.
function buildRows() {
  return microbesEn.map((en) => {
    const sv = translationFor(svById, en.id, 'microbes_swe_v2.json');
    const fi = translationFor(fiById, en.id, 'microbes_fin_v2.json');

    return {
      id: en.id,

      // English
      common_name: en.common_name,
      scientific_name: en.scientific_name,
      type: en.type,
      bsl_level: en.bsl_level,
      lecture_text: en.lecture_text,
      feedback_correct: en.feedback_correct,
      feedback_incorrect: en.feedback_incorrect,

      // Swedish
      common_name_sv: sv.common_name,
      type_sv: sv.type,
      lecture_text_sv: sv.lecture_text,
      feedback_correct_sv: sv.feedback_correct,
      feedback_incorrect_sv: sv.feedback_incorrect,

      // Finnish
      common_name_fi: fi.common_name,
      type_fi: fi.type,
      lecture_text_fi: fi.lecture_text,
      feedback_correct_fi: fi.feedback_correct,
      feedback_incorrect_fi: fi.feedback_incorrect,
    };
  });
}

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('microbes', buildRows());
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('microbes', null, {});
  },
};

module.exports.buildRows = buildRows;