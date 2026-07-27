module.exports = (sequelize, DataTypes) => {
  const Microbe = sequelize.define('Microbe', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: false,
      allowNull: false,
    },

    // English
    common_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lecture_text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    feedback_correct: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    feedback_incorrect: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    // Swedish
    common_name_sv: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type_sv: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lecture_text_sv: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    feedback_correct_sv: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    feedback_incorrect_sv: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    // Language-independent
    scientific_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    bsl_level: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    tableName: 'microbes',
    timestamps: false,
  });

  return Microbe;
};