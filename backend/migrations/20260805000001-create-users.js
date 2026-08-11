'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      username: {
        type: Sequelize.STRING(32),
        allowNull: false,
      },
      password_hash: {
        type: Sequelize.STRING,
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

    // Uniqueness ignores case so `Test_User` and `test_user` cannot both exist,
    // while the stored value keeps whatever casing the player typed.
    await queryInterface.addIndex('users', {
      fields: [queryInterface.sequelize.fn('lower', queryInterface.sequelize.col('username'))],
      unique: true,
      name: 'users_username_lower_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
