import 'dotenv/config';
import unbPkg from 'unb-api';

const { Client } = unbPkg;
const unbClient = new Client(process.env.UNB_TOKEN);

const editBalance = async function(guildId, userId, amount, reason) {
  let amountObj = { cash: amount };

  if (amount < 0) {
    const userBalances = await unbClient.getUserBalance(guildId, userId);
    if (userBalances.cash < Math.abs(amount)) {
      amountObj = { bank: amount };
    }
  }

  await unbClient.editUserBalance(guildId, userId, amountObj, reason);
};

export { editBalance };