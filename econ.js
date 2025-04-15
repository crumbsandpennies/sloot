import 'dotenv/config';
import unbPkg from 'unb-api';

const { Client } = unbPkg;
const unbClient = new Client(process.env.UNB_TOKEN);

const editBalance = function(userId, amount, reason) {
  unbClient.editUserBalance(process.env.GUILD_ID, userId, { cash: amount }, reason);
};

export { editBalance };