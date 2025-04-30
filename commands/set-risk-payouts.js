import { MessageFlags, PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import { models } from '../db/sequelize.js';

const { Guild } = models;

const { Flags } = PermissionsBitField;

export default {
  data: new SlashCommandBuilder()
    .setName('set-risk-payouts')
    .setDescription('Set the risk/caught system payouts.')
    .addIntegerOption(option =>
      option.setName('risk-payout')
        .setDescription('How much should a risker be rewarded for a successful risk (multiplies by their current streak)?')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('hunter-payout')
        .setDescription('How much does the first hunter get for a catch? Second gets 1/2, and third gets 1/4 this amount.')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('hunter-missed-fee')
        .setDescription('How much should all members with the hunter role be charged if they collectively miss a risk?')
        .setRequired(true)),
    async execute(interaction) {
      if (!interaction.member.permissions.has(Flags.Administrator)) {
        await interaction.reply("You don't have permission to use this.");
        return;
      }

      try {
        const guild = interaction.guild;
        const riskPayout = await interaction.options.getInteger('risk-payout');
        const hunterPayout = await interaction.options.getInteger('hunter-payout');
        const hunterMissedFee = await interaction.options.getInteger('hunter-missed-fee');

        const [guildInstance] = await Guild.findOrCreate({
          where: {
            discord_id: guild.id
          }
        });

        await guildInstance.update({
          risk_payout: riskPayout,
          hunter_payout: hunterPayout,
          hunter_missed_fee: hunterMissedFee
        });

        await interaction.reply({
          content: `Successfully set new payouts amounts.`,
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