module.exports = (sequelize, DataTypes) => {
  const BSLMaterial = sequelize.define('BSLMaterial', {
    language: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    content: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
  }, {
    tableName: 'bsl_material',
    timestamps: false,
  });

  return BSLMaterial;
};
