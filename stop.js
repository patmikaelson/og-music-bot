
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('قطع آهنگ و خروج از ویس'),

  async execute(interaction) {
    await interaction.reply('⛔ موزیک متوقف شد و از ویس خارج شد (فعلاً تستی)');
  }
};
