import 'dotenv/config';
import { MessageFlags, Events } from 'discord.js';
import { editBalance } from '../econ.js';
import { models } from '../db/sequelize.js';
import {
  CHANNEL_TYPES,
  ROLE_TYPES
} from '../constants.js';

const { Guild, Member } = models;

let state = {
  risks: new Map(),
  catches: new Map(),
  global_cooldown_active: false,
};

const deleteMessage = function(client, channelId, messageId) {
  client.channels.fetch(channelId).then(channel => {
    channel.messages.delete(messageId);
  });
}

const postRiskResult = async function(message, client, guild, riskChannel, caughtChannel) {
  const guildId = message.guild.id;
  const riskMessageId = message.id;
  await message.guild.members.fetch();

  const guildInstance = await Guild.findOrCreate({
    where: {
      discord_id: guildId
    },
    defaults: {
      discord_id: guildId
    }
  });

  const [risker] = await Member.findOrCreate({
    where: {
      discord_id: message.author.id
    },
    defaults: {
      discord_id: message.author.id,
      guild_id: guildInstance.id
    }
  });

  const [hunterRole] = await guild.getRoles({
    where: {
      type: ROLE_TYPES.HUNTER
    }
  });

  let result = {
    risker: state.risks.get(riskMessageId).author,
    catches: []
  };

  state.risks.delete(riskMessageId);
  deleteMessage(client, riskChannel.discord_id, riskMessageId);

  if (state.catches.size >= 1) {
    state.catches.forEach(function(caughtRiskMessageId, hunterId) {
      if (caughtRiskMessageId === riskMessageId) {
        result.catches.push(hunterId);
        state.catches.delete(hunterId);
      }
    });
  }

  let resultMessage = `<@${ result.risker.id }> was caught by:`;

  if (result.catches.length) {
    let i = 0;
    for (const hunterId of result.catches) {
      const discordMember = message.guild.members.cache.get(hunterId);
      if (!discordMember.roles.cache.has(hunterRole.discord_id)) {
        continue;
      }

      const rewardAmount = i === 0 ? guild.hunter_payout : i === 1 ? (parseInt(guild.hunter_payout / 2)) : i === 2 ? (parseInt(guild.hunter_payout / 4)) : 0;
      const [hunter] = await Member.findOrCreate({
        where: {
          discord_id: hunterId
        },
        defaults: {
          discord_id: hunterId,
          guild_id: guildInstance.id
        }
      });

      if (rewardAmount > 0) {
        await editBalance(guildId, result.risker.id, -rewardAmount, 'Risk fail');
        risker.lifetime_losses += rewardAmount;
        await editBalance(guildId, hunterId, rewardAmount, 'Hunter success');
        hunter.lifetime_wins += rewardAmount;

        await risker.save();
        await hunter.save();
      }

      resultMessage += `\n ${i}. <@${ hunterId }> (${rewardAmount} coins)`;
      i++;
    };
    risker.current_risk_streak = 0;
    await risker.save();
  } else {
    risker.current_risk_streak += 1;
    if (risker.current_risk_streak > risker.highest_risk_streak) {
      risker.highest_risk_streak = risker.current_risk_streak;
    }
    let totalPayout = guild.risk_payout * risker.current_risk_streak;

    await editBalance(guildId, result.risker.id, totalPayout, 'Risk success');
    risker.lifetime_wins += totalPayout;

    const hunters = message.guild.roles.cache.get(hunterRole.discord_id).members;

    await Promise.all(hunters.map(async function (member) {
      const [hunter] = await Member.findOrCreate({
        where: {
          discord_id: member.id
        },
        defaults: {
          discord_id: member.id,
          guild_id: guildInstance.id
        }
      });

      // TODO: Currently only penalizing hunters for misses, which we may or may not want.
      // If we keep this functionality, we may want to transfer the hunter miss fee to the risker
      await editBalance(guildId, member.id, -guild.hunter_missed_fee, 'Hunter fail');
      hunter.lifetime_losses += guild.hunter_missed_fee;

      await hunter.save();
      return;
    }));

    await risker.save();
    resultMessage = `<@${ result.risker.id }> got away! (${totalPayout} coins)`;
  }

  client.channels.cache.get(caughtChannel.discord_id).send(resultMessage);
  return;
}

export default {
  name: Events.MessageCreate,
  once: false,
  async execute(client, message) {  
    const guild = await Guild.findOne({
      where: {
        discord_id: message.guild.id
      }
    });
    const [riskChannel] = await guild.getChannels({
      where: {
        type: CHANNEL_TYPES.RISK
      }
    });
    const [caughtChannel] = await guild.getChannels({
      where: {
        type: CHANNEL_TYPES.CAUGHT
      }
    });

    if (message.channel.id === riskChannel.discord_id) {
      const [riskerRole] = await guild.getRoles({
        where: {
          type: ROLE_TYPES.RISKER
        }
      });
      const isRisker = await message.member.roles.cache.get(riskerRole.discord_id);

      if (isRisker && !state.global_cooldown_active && message.attachments.size >= 1) {
        // Set cooldown for any risker to post again
        state.global_cooldown_active = true;
        const cooldownExpiresAt = Math.floor((Date.now() + guild.risk_cooldown_global) / 1000);
        const cooldownMessage = await client.channels.cache.get(riskChannel.discord_id).send(`Risk posting is now on cooldown. It will be available again <t:${cooldownExpiresAt}:R>.`);

        setTimeout(() => {
          deleteMessage(client, riskChannel.discord_id, cooldownMessage.id);
          state.global_cooldown_active = false;
        }, guild.risk_cooldown_global);

        // TODO: Set cooldown for specific risker to post again

        state.risks.set(message.id, message);
        setTimeout(postRiskResult, guild.risk_timer, message, client, guild, riskChannel, caughtChannel);
      } else {
        if (!message.pinned && !(message.author.id === client.user.id)) {
          deleteMessage(client, riskChannel.discord_id, message.id);
        }
        // TODO: Can't send ephemeral message without interaction response. How better to show this?
        // if (state.global_cooldown_active) {
          // TODO: Get precise timer for cooldown
          // client.channels.cache.get(riskChannel.discord_id).send({
          //   content: 'Risk posting is on cooldown. Try again soon.',
          //   flags: MessageFlags.Ephemeral
          // });
        // }
      }
    }
  
    if (message.channel.id === caughtChannel.discord_id && message.messageSnapshots.size === 1) {
      const [snapshotId] = message.messageSnapshots.keys();
  
      if (state.risks.size >= 1) {
        state.risks.forEach(function(value) {
          if (value.id === snapshotId) {
            if (!state.catches.has(message.author.id)) {
              state.catches.set(message.author.id, snapshotId);
            }
          }
        });
      }
    }
  }
};