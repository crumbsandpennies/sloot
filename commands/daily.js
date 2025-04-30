import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { models } from '../db/sequelize.js';
import { editBalance } from '../econ.js';
const { Guild, Member } = models;

const getMultiplier = (streak) => {
  switch (true) {
    case streak === 1:
      return 1;
    case streak === 2:
      return 1.1;
    case streak === 3:
      return 1.2;
    case streak === 4:
      return 1.4;
    case streak === 5:
      return 1.8;
    case streak === 6:
      return 2.5;
    case streak >= 7:
      return 4;
    default:
      return 1;
  }
}

const getNextUTCMidnight = () => {
  const now = new Date();
  const nextDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));
  return Math.floor(nextDay.getTime() / 1000);
}

export default {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Collect your daily income.'),
  async execute(interaction) {
    const [guild] = await Guild.findOrCreate({
      where: {
        discord_id: interaction.guild.id
      },
      defaults: {
        discord_id: interaction.guild.id
      }
    });

    const [member] = await Member.findOrCreate({
      where: {
        discord_id: interaction.user.id
      },
      defaults: {
        discord_id: interaction.user.id
      }
    });

    if (member.daily_claimed) {
      await interaction.reply({
        content: `You've already claimed your daily today. Try again at <t:${getNextUTCMidnight()}:T>.`,
        flags: MessageFlags.Ephemeral
      });

      return;
    }

    member.daily_claimed = true;
    member.daily_streak += 1;

    const min = Math.ceil(guild.daily_payout_min);
    const max = Math.floor(guild.daily_payout_max);
    const basePayout = Math.floor(Math.random() * (max - min + 1) + min)
    const multiplier = getMultiplier(member.daily_streak);
    const finalPayout = Math.ceil(basePayout * multiplier);

    await editBalance(interaction.guild.id, interaction.user.id, finalPayout, 'daily');
    await member.save();

    await interaction.reply({
      content: `You got ${finalPayout} coins (${basePayout} base x ${multiplier} multiplier). You've claimed your daily ${member.daily_streak} days in a row!`,
      flags: MessageFlags.Ephemeral
    });
  }
};