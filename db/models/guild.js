export default (sequelize, DataTypes) => {
  sequelize.define('Guild', {
    discord_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    risk_payout: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 50,
    },
    hunter_payout: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 20,
    },
    hunter_missed_fee: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
    },
    risk_timeout: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10000
    }
  },
  {
    tableName: 'Guild'
  });
};