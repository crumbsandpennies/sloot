import { SlashCommandBuilder } from 'discord.js';
import { models } from '../db/sequelize.js';
const { Member } = models;

export default {
  data: new SlashCommandBuilder()
    .setName('lifetime-stats')
    .setDescription('Shows how much you have won/lost all time with the risk/caught game.'),
  async execute(interaction) {
    const [member] = await Member.findOrCreate({
      where: {
        discord_id: interaction.user.id
      },
      defaults: {
        discord_id: interaction.user.id
      }
    });

    const message = `Lifetime wins: ${member.lifetime_wins} coins\nLifetime losses: ${member.lifetime_losses} coins`;

    interaction.reply(message);
  }
};