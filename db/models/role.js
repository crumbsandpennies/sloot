export default (sequelize, DataTypes) => {
  sequelize.define('Role', {
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
    tableName: 'Role'
  });
}