'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('microbes', 'common_name_sv', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: '',
    });

    await queryInterface.addColumn('microbes', 'type_sv', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: '',
    });

    await queryInterface.addColumn('microbes', 'lecture_text_sv', {
      type: Sequelize.TEXT,
      allowNull: false,
      defaultValue: '',
    });

    await queryInterface.addColumn('microbes', 'feedback_correct_sv', {
      type: Sequelize.TEXT,
      allowNull: false,
      defaultValue: '',
    });

    await queryInterface.addColumn('microbes', 'feedback_incorrect_sv', {
      type: Sequelize.TEXT,
      allowNull: false,
      defaultValue: '',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('microbes', 'feedback_incorrect_sv');
    await queryInterface.removeColumn('microbes', 'feedback_correct_sv');
    await queryInterface.removeColumn('microbes', 'lecture_text_sv');
    await queryInterface.removeColumn('microbes', 'type_sv');
    await queryInterface.removeColumn('microbes', 'common_name_sv');
  },
};