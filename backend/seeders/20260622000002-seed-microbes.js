'use strict';

const microbes = require('../data/microbes_eng_v2.json');

module.exports = {
  async up(queryInterface) {
    const rows = microbes.map((m) => ({
      id: m.id,
      common_name: m.common_name,
      scientific_name: m.scientific_name,
      type: m.type,
      bsl_level: m.bsl_level,
      lecture_text: m.lecture_text,
      feedback_correct: m.feedback_correct,
      feedback_incorrect: m.feedback_incorrect,
    }));
    await queryInterface.bulkInsert('microbes', rows);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('microbes', null, {});
  },
};
