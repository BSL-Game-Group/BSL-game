module.exports = (sequelize, DataTypes) => {
  const Microbe = sequelize.define('Microbe', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: false,
      allowNull: false,
    },
    common_name: { type: DataTypes.STRING, allowNull: false },
    scientific_name: { type: DataTypes.STRING, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false },
    bsl_level: { type: DataTypes.INTEGER, allowNull: false },
    lecture_text: { type: DataTypes.TEXT, allowNull: false },
    feedback_correct: { type: DataTypes.TEXT, allowNull: false },
    feedback_incorrect: { type: DataTypes.TEXT, allowNull: false },
  }, {
    tableName: 'microbes',
    timestamps: false,
  });

  return Microbe;
};
