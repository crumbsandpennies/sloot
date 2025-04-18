import 'dotenv/config';
import unbPkg from 'unb-api';

const { Client } = unbPkg;
const unbClient = new Client(process.env.UNB_TOKEN);

const editBalance = function(guildId, userId, amount, reason) {
  unbClient.editUserBalance(guildId, userId, { cash: amount }, reason);
};

export { editBalance };