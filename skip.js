
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('رد کردن آهنگ فعلی'),

  async execute(interaction) {
    await interaction.reply('⏭️ آهنگ رد شد (فعلاً شبیه‌سازی شده)');
  }
};
