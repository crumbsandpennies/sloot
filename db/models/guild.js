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
    risk_timer: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 60000
    },
    risk_cooldown_global: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 300000
    },
    risk_cooldown_user: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3600000
    }
  },
  {
    tableName: 'Guild'
  });
};