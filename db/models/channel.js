export default (sequelize, DataTypes) => {
  sequelize.define('Channel', {
    discord_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false
    }
  },
  {
    tableName: 'Channel'
  });
};