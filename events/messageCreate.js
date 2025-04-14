import 'dotenv/config';
import { Events } from 'discord.js';

let state = {
  risks: new Map(),
  catches: new Map(),
};

const deleteMessage = function(client, channel, messageId) {
  client.channels.fetch(process.env.RISK_CHANNEL).then(channel => {
    channel.messages.delete(messageId);
  });
}

const postRiskResult = function(riskMessageId, client) {
  deleteMessage(client, process.env.RISK_CHANNEL, riskMessageId);

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
    result.catches.forEach(function(hunterId, i) {
      resultMessage += `\n ${i}. <@${ hunterId }> (Payout: ${i === 0 ? '20' : i === 1 ? '10' : i === 2 ? '5' : '0'} coins)`;
    });
  } else {
    resultMessage = `<@${ result.risker.id }> got away! Payout: 50 coins.`;
  }

  client.channels.cache.get(process.env.CAUGHT_CHANNEL).send(resultMessage);
}

export default {
  name: Events.MessageCreate,
  once: false,
  async execute(client, message) {
    if (message.channel.id === process.env.RISK_CHANNEL) {
      if (message.attachments.size >= 1) {
        state.risks.set(message.id, message);
        setTimeout(postRiskResult, process.env.RISK_DURATION, message.id, client);
      } else {
        if (!message.pinned) {
          deleteMessage(client, process.env.RISK_CHANNEL, message.id);
        }
      }
    }
  
    if (message.channel.id === process.env.CAUGHT_CHANNEL && message.messageSnapshots.size === 1) {
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