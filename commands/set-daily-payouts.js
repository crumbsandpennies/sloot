import { MessageFlags, PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import { models } from '../db/sequelize.js';

const { Guild } = models;

const { Flags } = PermissionsBitField;

export default {
  data: new SlashCommandBuilder()
    .setName('set-daily-payout-min-max')
    .setDescription('Set base min and max values for the daily payout command.')
    .addIntegerOption(option =>
      option.setName('daily-payout-min')
        .setDescription('The minimum base value that can be earned using the daily command. (Default: 50)')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('daily-payout-max')
        .setDescription('The maximum base value that can be earned using the daily command. (Default: 120)')
        .setRequired(true)),
    async execute(interaction) {
      if (!interaction.member.permissions.has(Flags.Administrator)) {
        await interaction.reply("You don't have permission to use this.");
        return;
      }
      
      try {
        const dailyPayoutMin = await interaction.options.getInteger('daily-payout-min');
        const dailyPayoutMax = await interaction.options.getInteger('daily-payout-max');
      

        const [guild] = await Guild.findOrCreate({
          where: {
            discord_id: interaction.guild.id
          },
          defaults: {
            discord_id: interaction.guild.id
          }
        });

        await guild.update({
          daily_payout_min: dailyPayoutMin,
          daily_payout_max: dailyPayoutMax,
        });

        await interaction.reply({
          content: `Successfully set new daily base payout min/max.`,
          flags: MessageFlags.Ephemeral
        });
      } catch(e) {
        console.log(e);
        await interaction.reply({
          content: `Oops! Something went wrong.`,
          flags: MessageFlags.Ephemeral
        });
      }
  },
};