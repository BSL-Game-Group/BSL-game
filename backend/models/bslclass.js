module.exports = (sequelize, DataTypes) => {
  const BSLClass = sequelize.define('BSLClass', {
    class_number: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: false,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    required_equipment: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
  }, {
    tableName: 'bsl_classes',
    timestamps: false,
  });

  return BSLClass;
};
