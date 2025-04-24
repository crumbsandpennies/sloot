import { ActivityType, Events } from 'discord.js';

export default {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`Ready! Logged in as ${client.user.tag}`);
    client.user.setActivity("with your mom", { type: ActivityType.Playing });
  },
};