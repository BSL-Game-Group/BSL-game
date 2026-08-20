module.exports = (sequelize, DataTypes) => {
  const RoundAnswer = sequelize.define(
    'RoundAnswer',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      round_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      microbe_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      chosen_level: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      chosen_equipment: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      level_correct: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      equipment_correct: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      attempt: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
    },
    {
      tableName: 'round_answers',
      timestamps: true,
    }
  );

  return RoundAnswer;
};
