
const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const axios = require('axios');
const cheerio = require('cheerio');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('جستجو و پخش آهنگ فارسی از سایت ایرانی (مثلاً: معین ای خدا)')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('نام خواننده و آهنگ')
        .setRequired(true)
    ),

  async execute(interaction) {
    const query = interaction.options.getString('query');
    const member = interaction.member;

    if (!member.voice.channel) {
      return await interaction.reply({ content: '⛔ لطفاً وارد یک Voice Channel شو.', ephemeral: true });
    }

    await interaction.deferReply();

    try {
      // جستجو در سایت nava.ir (یا سایت مشابه)
      const searchUrl = `https://nava.ir/?s=${encodeURIComponent(query)}`;
      const response = await axios.get(searchUrl);
      const $ = cheerio.load(response.data);

      // پیدا کردن اولین لینک آهنگ
      const firstLink = $('a.more-link').first().attr('href');
      if (!firstLink) return await interaction.editReply('❌ آهنگی پیدا نشد.');

      const trackPage = await axios.get(firstLink);
      const $$ = cheerio.load(trackPage.data);

      const mp3Url = $$('audio source').attr('src');
      if (!mp3Url || !mp3Url.endsWith('.mp3')) {
        return await interaction.editReply('❌ لینک MP3 معتبر پیدا نشد.');
      }

      const connection = joinVoiceChannel({
        channelId: member.voice.channel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
        selfDeaf: false,
      });

      const player = createAudioPlayer();
      const resource = createAudioResource(mp3Url, { inlineVolume: true });
      resource.volume.setVolume(1.0);

      player.play(resource);
      connection.subscribe(player);

      player.on(AudioPlayerStatus.Idle, () => {
        connection.destroy();
      });

      await interaction.editReply(`🎵 در حال پخش آهنگ فارسی: ${query}`);
    } catch (err) {
      console.error(err);
      await interaction.editReply('❌ خطا در جستجو یا پخش آهنگ.');
    }
  },
};
