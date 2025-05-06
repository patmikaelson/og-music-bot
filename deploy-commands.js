
require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');

const commands = [];
const commandFiles = fs.readdirSync(__dirname).filter(file =>
  file.endsWith('.js') && file !== 'index.js' && file !== 'queueMap.js'
);

for (const file of commandFiles) {
  const command = require(`./${file}`);
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('🛰️ در حال ریجستر کردن اسلش کامندها...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log('✅ اسلش کامندها با موفقیت ریجستر شدند.');
  } catch (error) {
    console.error(error);
  }
})();
