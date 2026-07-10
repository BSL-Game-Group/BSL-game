'use strict';

const microbesSv = require('../data/microbes_swe_v2.json');

module.exports = {
  async up(queryInterface) {
    for (const microbe of microbesSv) {
      await queryInterface.bulkUpdate(
        'microbes',
        {
          common_name_sv: microbe.common_name,
          type_sv: microbe.type,
          lecture_text_sv: microbe.lecture_text,
          feedback_correct_sv: microbe.feedback_correct,
          feedback_incorrect_sv: microbe.feedback_incorrect,
        },
        {
          id: microbe.id,
        }
      );
    }
  },

  async down(queryInterface) {
    for (const microbe of microbesSv) {
      await queryInterface.bulkUpdate(
        'microbes',
        {
          common_name_sv: '',
          type_sv: '',
          lecture_text_sv: '',
          feedback_correct_sv: '',
          feedback_incorrect_sv: '',
        },
        {
          id: microbe.id,
        }
      );
    }
  },
};