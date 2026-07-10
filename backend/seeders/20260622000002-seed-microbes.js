'use strict';

const microbesEn = require('../data/microbes_eng_v2.json');
const microbesSv = require('../data/microbes_swe_v2.json');
const microbesFi = require('../data/microbes_fin_v2.json');

module.exports = {
  async up(queryInterface) {
    const rows = microbesEn.map((en, index) => {
      const sv = microbesSv[index];
      const fi = microbesFi[index];

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

    await queryInterface.bulkInsert('microbes', rows);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('microbes', null, {});
  },
};