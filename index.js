
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

client.commands = new Collection();

const commandsPath = __dirname;
const commandFiles = fs.readdirSync(commandsPath).filter(file =>
  file.endsWith('.js') && file !== 'index.js' && file !== 'queueMap.js'
);

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  }
}

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: '❌ خطایی در اجرای دستور پیش اومده.', ephemeral: true });
  }
});

client.once('ready', () => {
  console.log(`🎵 OG Music آماده‌ست به نام ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
