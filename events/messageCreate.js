import 'dotenv/config';
import { Events } from 'discord.js';
import { editBalance } from '../econ.js';
import { models } from '../db/sequelize.js';
import {
  CHANNEL_TYPES,
  ROLE_TYPES
} from '../constants.js';

const { Guild, Member, Role } = models;

let state = {
  risks: new Map(),
  catches: new Map(),
};

const deleteMessage = function(client, channelId, messageId) {
  client.channels.fetch(channelId).then(channel => {
    channel.messages.delete(messageId);
  });
}

const postRiskResult = async function(message, client, guild, riskChannel, caughtChannel) {
  // TODO: Implement streaks
  const guildId = message.guild.id;
  const riskMessageId = message.id;

  const [risker] = await Member.findOrCreate({
    where: {
      discord_id: message.author.id
    },
    defaults: {
      discord_id: message.author.id
    }
  });

  deleteMessage(client, riskChannel.discord_id, riskMessageId);

  let result = {
    risker: state.risks.get(riskMessageId).author,
    catches: []
  };

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
      const rewardAmount = i === 0 ? guild.hunter_payout : i === 1 ? (guild.hunter_payout / 2) : i === 2 ? (guild.hunter_payout / 4) : 0;
      const [hunter] = await Member.findOrCreate({
        where: {
          discord_id: hunterId
        },
        defaults: {
          discord_id: hunterId
        }
      });

      if (rewardAmount > 0) {
        editBalance(guildId, result.risker.id, -rewardAmount, 'Risk fail');
        risker.lifetime_losses += rewardAmount;
        editBalance(guildId, hunterId, rewardAmount, 'Hunter success');
        hunter.lifetime_wins += rewardAmount;

        await risker.save();
        await hunter.save();
      }

      resultMessage += `\n ${i}. <@${ hunterId }> (${rewardAmount} coins)`;
      i++;
    };
  } else {
    editBalance(guildId, result.risker.id, guild.risk_payout, 'Risk success');
    risker.lifetime_wins += guild.risk_payout;
    const [hunterRole] = await guild.getRoles({
      where: {
        type: ROLE_TYPES.HUNTER
      }
    });

    await message.guild.members.fetch();
    const hunters = message.guild.roles.cache.get(hunterRole.discord_id).members;

    await Promise.all(hunters.map(async function (member) {
      const [hunter] = await Member.findOrCreate({
        where: {
          discord_id: member.id
        },
        defaults: {
          discord_id: member.id
        }
      });

      editBalance(guildId, member.id, -guild.hunter_missed_fee, 'Hunter fail');
      hunter.lifetime_losses += guild.hunter_missed_fee;

      hunter.save();
      return;
    }));

    await risker.save();
    resultMessage = `<@${ result.risker.id }> got away! (${guild.risk_payout} coins)`;
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
      if (message.attachments.size >= 1) {
        state.risks.set(message.id, message);
        setTimeout(postRiskResult, guild.risk_timeout, message, client, guild, riskChannel, caughtChannel);
      } else {
        if (!message.pinned) {
          deleteMessage(client, riskChannel.discord_id, message.id);
        }
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