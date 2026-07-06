'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('room_entries', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      session_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      room_key: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      entered_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      exited_at: {
        type: Sequelize.DATE,
        allowNull: true,
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable('room_entries');
  },
};
