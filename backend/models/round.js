module.exports = (sequelize, DataTypes) => {
  const Round = sequelize.define(
    'Round',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      // Null IS the guest round — the state the claim UPDATE looks for.
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      session_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      score: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      correct_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      answer_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      claimed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'rounds',
      timestamps: true,
    }
  );

  return Round;
};
