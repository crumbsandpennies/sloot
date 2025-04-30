import { models } from './db/sequelize.js';

const { Member } = models;

const members = await Member.findAll();

members.forEach(async (member) => {
  if (!member.daily_claimed) {
    member.daily_streak = 0;
  }

  member.daily_claimed = false;
  await member.save();
})