module.exports = (sequelize, DataTypes) => {
  const RoomEntry = sequelize.define(
    'RoomEntry',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      session_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      room_key: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      entered_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      exited_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'room_entries',
      timestamps: true,
    }
  );

  return RoomEntry;
};
