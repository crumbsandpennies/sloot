import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { Collection } from 'discord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadCommands(client) {
  client.commands = new Collection();
  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = (await fs.readdir(commandsPath)).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const { default: command } = await import(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }
}

async function loadEvents(client) {
  const eventsPath = path.join(__dirname, 'events');
  const eventFiles = (await fs.readdir(eventsPath)).filter(file => file.endsWith('.js'));

  for (const file of eventFiles) {
	  const filePath = path.join(eventsPath, file);
    const { default: event } = await import(filePath);

	  if (event.once) {
		  client.once(event.name, (...args) => event.execute(client, ...args));
	  } else {
		  client.on(event.name, (...args) => event.execute(client, ...args,));
	  }
  }
}

export { loadCommands, loadEvents };