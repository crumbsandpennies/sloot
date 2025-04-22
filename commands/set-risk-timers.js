import { MessageFlags, PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import { models } from '../db/sequelize.js';

const { Guild } = models;

const { Flags } = PermissionsBitField;

export default {
  data: new SlashCommandBuilder()
    .setName('set-risk-timers')
    .setDescription('Set the risk/caught system payouts.')
    .addIntegerOption(option =>
      option.setName('risk-timer')
        .setDescription('How long should a risk post stay in the risk channel? (in milliseconds, default: 60000)')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('risk-cooldown-global')
        .setDescription('How long after a risk until other users can post risks? (in milliseconds, default: 300000)')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('risk-cooldown-user')
        .setDescription('How long after a risk until the user can post risk again? (in milliseconds, default: 3600000)')
        .setRequired(true)),
    async execute(interaction) {
      if (!interaction.member.permissions.has(Flags.ManageRoles) || !interaction.member.permissions.has(Flags.ManageChannels)) {
        await interaction.reply("You don't have permission to use this.");
        return;
      }

      try {
        const guild = interaction.guild;
        const riskTimer = await interaction.options.getInteger('risk-timer');
        const riskCooldownGlobal = await interaction.options.getInteger('risk-cooldown-global');
        const riskCooldownUser = await interaction.options.getInteger('risk-cooldown-user');

        const [guildInstance] = await Guild.findOrCreate({
          where: {
            discord_id: guild.id
          }
        });

        await guildInstance.update({
          risk_timer: riskTimer,
          risk_cooldown_global: riskCooldownGlobal,
          risk_cooldown_user: riskCooldownUser
        });

        await interaction.reply({
          content: `Successfully set new timer lengths.`,
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