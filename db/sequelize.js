import 'dotenv/config';
import { Sequelize, DataTypes } from 'sequelize';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const modelsPath = path.join(__dirname, 'models');
const modelFiles = (await fs.readdir(modelsPath)).filter(file => file.endsWith('.js'));

const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite',
});

for (const file of modelFiles) {
  const filePath = path.join(modelsPath, file);
  const { default: modelDefine } = await import(filePath);
  modelDefine(sequelize, DataTypes);
}

const { models } = sequelize;
const { Guild, Channel, Role, Member } = models;

// create relationships for models
Guild.hasMany(Channel, {
  foreignKey: 'guild_id'
});
Guild.hasMany(Role, {
  foreignKey: 'guild_id'
});
Guild.hasMany(Member, {
  foreignKey: 'guild_id'
});
Channel.belongsTo(Guild, {
  foreignKey: 'guild_id'
});
Role.belongsTo(Guild, {
  foreignKey: 'guild_id'
});
Member.belongsTo(Guild, {
  foreignKey: 'guild_id'
});

const force = process.argv.includes('--force') || process.argv.includes('-f');

sequelize.sync({ force }).then(async () => {
  console.log('Database synced');
}).catch(console.error);

export { models };