'use strict';

const microbesFi = require('../data/microbes_fin_v2.json');

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('microbes', 'common_name_fi', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: '',
    });

    await queryInterface.addColumn('microbes', 'type_fi', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: '',
    });

    await queryInterface.addColumn('microbes', 'lecture_text_fi', {
      type: Sequelize.TEXT,
      allowNull: false,
      defaultValue: '',
    });

    await queryInterface.addColumn('microbes', 'feedback_correct_fi', {
      type: Sequelize.TEXT,
      allowNull: false,
      defaultValue: '',
    });

    await queryInterface.addColumn('microbes', 'feedback_incorrect_fi', {
      type: Sequelize.TEXT,
      allowNull: false,
      defaultValue: '',
    });

    // Backfill existing rows here, in the migration itself — not in a seeder.
    // Seeders only run once per filename (tracked in SequelizeData), so on any
    // database that already seeded 'microbes' before this migration existed,
    // updating the seeder file alone would never actually populate these
    // columns. A migration always runs against every database exactly once,
    // regardless of prior seeder history.
    for (const microbe of microbesFi) {
      await queryInterface.bulkUpdate(
        'microbes',
        {
          common_name_fi: microbe.common_name,
          type_fi: microbe.type,
          lecture_text_fi: microbe.lecture_text,
          feedback_correct_fi: microbe.feedback_correct,
          feedback_incorrect_fi: microbe.feedback_incorrect,
        },
        { id: microbe.id }
      );
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('microbes', 'feedback_incorrect_fi');
    await queryInterface.removeColumn('microbes', 'feedback_correct_fi');
    await queryInterface.removeColumn('microbes', 'lecture_text_fi');
    await queryInterface.removeColumn('microbes', 'type_fi');
    await queryInterface.removeColumn('microbes', 'common_name_fi');
  },
};
