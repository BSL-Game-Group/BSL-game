'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('microbes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
      },
      common_name: { type: Sequelize.STRING, allowNull: false },
      scientific_name: { type: Sequelize.STRING, allowNull: false },
      type: { type: Sequelize.STRING, allowNull: false },
      bsl_level: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'bsl_classes', key: 'class_number' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      lecture_text: { type: Sequelize.TEXT, allowNull: false },
      feedback_correct: { type: Sequelize.TEXT, allowNull: false },
      feedback_incorrect: { type: Sequelize.TEXT, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('microbes');
  },
};
