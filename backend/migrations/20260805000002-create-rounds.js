'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('rounds', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      // Null is the guest round. Losing the account must not lose the round.
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      session_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      score: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      correct_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      answer_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      // Non-null means the round was rescued from a guest session rather than
      // created while signed in.
      claimed_at: {
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

    // Serves the claim UPDATE and any lookup by session_id alone, since
    // session_id leads.
    await queryInterface.addIndex('rounds', {
      fields: ['session_id', 'user_id'],
      name: 'rounds_session_id_user_id',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('rounds');
  },
};
