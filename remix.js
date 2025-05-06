
const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const axios = require('axios');
const cheerio = require('cheerio');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remix')
    .setDescription('پخش یک ریمیکس ایرانی به صورت رندوم از سایت‌های داخلی'),

  async execute(interaction) {
    const member = interaction.member;

    if (!member.voice.channel) {
      return await interaction.reply({ content: '⛔ لطفاً وارد یک Voice Channel شو.', ephemeral: true });
    }

    await interaction.deferReply();

    try {
      // مثال: رفتن به صفحه ریمیکس‌ها در سایت موزیک‌فارسی یا نواسانگ
      const remixPage = await axios.get('https://nava.ir/category/remix/');
      const $ = cheerio.load(remixPage.data);

      // گرفتن لیست پست‌ها و انتخاب رندوم
      const posts = $('a.more-link').map((i, el) => $(el).attr('href')).get();
      if (!posts.length) return await interaction.editReply('❌ ریمیکس پیدا نشد.');

      const randomPost = posts[Math.floor(Math.random() * posts.length)];
      const remixTrack = await axios.get(randomPost);
      const $$ = cheerio.load(remixTrack.data);

      const mp3Url = $$('audio source').attr('src');
      const title = $('h1.entry-title').text() || 'ریمیکس ناشناس';

      if (!mp3Url || !mp3Url.endsWith('.mp3')) {
        return await interaction.editReply('❌ لینک mp3 معتبر پیدا نشد.');
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
        connection.destroy(); // برای دائمی شدن باید تغییر کنه
      });

      await interaction.editReply(`🎵 در حال پخش ریمیکس: ${title}`);
    } catch (err) {
      console.error(err);
      await interaction.editReply('❌ خطا در پخش ریمیکس.');
    }
  },
};
