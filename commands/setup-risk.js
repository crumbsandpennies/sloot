import { MessageFlags, PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import { models } from '../db/sequelize.js';
import {
  CHANNEL_TYPES,
  ROLE_TYPES
} from '../constants.js';

const { Guild, Channel, Role } = models;

const { Flags } = PermissionsBitField;

export default {
  data: new SlashCommandBuilder()
    .setName('setup-risk')
    .setDescription('Set up the risk/caught system by specifying the appropriate channels and roles.')
    .addChannelOption(option =>
      option.setName('risk-channel')
        .setDescription('The channel where users will post risked media.')
        .setRequired(true))
    .addChannelOption(option =>
      option.setName('caught-channel')
        .setDescription('The channel where caught media and/or payouts will be posted.')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('risker-role')
        .setDescription('The risker role.')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('hunter-role')
        .setDescription('The hunter role.')
        .setRequired(true)),
    async execute(interaction) {
      if (!interaction.member.permissions.has(Flags.ManageRoles) || !interaction.member.permissions.has(Flags.ManageChannels)) {
        await interaction.reply("You don't have permission to use this.");
        return;
      }

      try {
        const guild = interaction.guild;
        const riskChannel = await interaction.options.getChannel('risk-channel');
        const caughtChannel = await interaction.options.getChannel('caught-channel');
        const riskerRole = await interaction.options.getRole('risker-role');
        const hunterRole = await interaction.options.getRole('hunter-role');

        const [guildInstance] = await Guild.findOrCreate({
          where: {
            discord_id: guild.id
          },
          defaults: {
            discord_id: guild.id
          }
        });
        await Channel.findOrCreate({
          where: {
            guild_id: guildInstance.id,
            type: CHANNEL_TYPES.RISK
          },
          defaults: {
            discord_id: riskChannel.id,
            type: CHANNEL_TYPES.RISK,
            guild_id: guildInstance.id
          }
        });
        await Channel.findOrCreate({
          where: {
            guild_id: guildInstance.id,
            type: CHANNEL_TYPES.CAUGHT
          },
          defaults: {
            discord_id: caughtChannel.id,
            type: CHANNEL_TYPES.CAUGHT,
            guild_id: guildInstance.id
          }
        });
        await Role.findOrCreate({
          where: {
            guild_id: guildInstance.id,
            type: ROLE_TYPES.HUNTER
          },
          defaults: {
            discord_id: hunterRole.id,
            type: ROLE_TYPES.HUNTER,
            guild_id: guildInstance.id
          }
        });
        await Role.findOrCreate({
          where: {
            guild_id: guildInstance.id,
            type: ROLE_TYPES.RISKER
          },
          defaults: {
            discord_id: riskerRole.id,
            type: ROLE_TYPES.RISKER,
            guild_id: guildInstance.id
          }
        });

        await interaction.reply({
          content: `Risk/caught system successfully set up! Don't forget to set custom payouts if desired.`,
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