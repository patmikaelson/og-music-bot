
const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const GUILD_ID = process.env.GUILD_ID;
const VOICE_CHANNEL_ID = process.env.VOICE_CHANNEL_ID;

client.once('ready', async () => {
  console.log(`✅ Bot is ready as ${client.user.tag}`);
  startAutoPlay();
});

async function getRandomIranianSong() {
  try {
    const remixPage = await axios.get('https://nava.ir/category/remix/');
    const $ = cheerio.load(remixPage.data);
    const posts = $('a.more-link').map((i, el) => $(el).attr('href')).get();
    const randomPost = posts[Math.floor(Math.random() * posts.length)];
    const remixTrack = await axios.get(randomPost);
    const $$ = cheerio.load(remixTrack.data);
    const mp3Url = $$('audio source').attr('src');
    const title = $('h1.entry-title').text() || 'آهنگ ناشناس';
    return { mp3Url, title };
  } catch (err) {
    console.error('⚠️ خطا در دریافت آهنگ:', err.message);
    return null;
  }
}

async function startAutoPlay() {
  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    let voiceChannel;

    if (VOICE_CHANNEL_ID) {
      voiceChannel = await guild.channels.fetch(VOICE_CHANNEL_ID);
    }

    if (!voiceChannel || voiceChannel.type !== 2) { // 2 = GuildVoice
      console.warn('⚠️ چنل ویس معتبر پیدا نشد. در حال تلاش برای یافتن چنل ویس دیگر...');
      const allChannels = await guild.channels.fetch();
      voiceChannel = allChannels.find(c => c.type === 2);
      if (!voiceChannel) throw new Error('هیچ Voice Channel فعالی یافت نشد.');
    }

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: false,
    });

    const player = createAudioPlayer();
    connection.subscribe(player);

    async function playNext() {
      const song = await getRandomIranianSong();
      if (!song || !song.mp3Url) {
        console.log('❌ آهنگ جدید پیدا نشد، تلاش مجدد در 1 دقیقه...');
        return setTimeout(playNext, 60000);
      }

      console.log(`🎵 در حال پخش: ${song.title}`);
      const resource = createAudioResource(song.mp3Url, { inlineVolume: true });
      resource.volume.setVolume(1.0);
      player.play(resource);
    }

    player.on(AudioPlayerStatus.Idle, () => {
      console.log('🔁 آهنگ تموم شد، آهنگ بعدی...');
      playNext();
    });

    player.on('error', error => {
      console.error('⛔ خطای پخش:', error.message);
      playNext();
    });

    playNext();
  } catch (err) {
    console.error('❌ خطای کلی در اجرای بات:', err.message);
  }
}

client.login(process.env.DISCORD_TOKEN);
