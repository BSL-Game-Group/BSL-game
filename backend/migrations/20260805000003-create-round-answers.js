'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('round_answers', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      round_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'rounds', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      microbe_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'microbes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      chosen_level: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      chosen_equipment: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      level_correct: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      equipment_correct: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex('round_answers', {
      fields: ['round_id'],
      name: 'round_answers_round_id',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('round_answers');
  },
};
