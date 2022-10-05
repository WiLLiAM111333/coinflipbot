console.clear();
require('dotenv').config();
const { join } = require('path');
const { CoinflipClient } = require('./dist/lib/discord/client/CoinflipClient');

const client = new CoinflipClient({
  eventPath: join(__dirname, 'dist', 'src', 'events'),
  intents: [
    'Guilds',
    'GuildMembers',
    'GuildBans',
    'GuildEmojisAndStickers',
    'GuildIntegrations',
    'GuildWebhooks',
    'GuildInvites',
    'GuildVoiceStates',
    'GuildPresences',
    'GuildMessages',
    'GuildMessageReactions',
    'GuildMessageTyping',
    'DirectMessages',
    'DirectMessageReactions',
    'DirectMessageReactions',
    'MessageContent'
  ]
});

client.login(process.env.NODE_ENV === 'development' ? process.env.TOKEN_DEV : process.env.TOKEN)
