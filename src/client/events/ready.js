const { Client } = require('discord.js');
/**
 *
 * @param {Client} client
 */
module.exports = client => {
  console.log(`Logged in as ${client.user.tag}`);

  client.user.setPresence({
    activity: {
      type: 'PLAYING',
      name: 'Drachmae Flipper'
    },
    status: 'online'
  })
}
