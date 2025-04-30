export default (sequelize, DataTypes) => {
  sequelize.define('Member', {
    discord_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    current_risk_streak: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    highest_risk_streak: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    lifetime_wins: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    lifetime_losses: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    daily_claimed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    daily_streak: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  },
  {
    tableName: 'Member'
  });
};