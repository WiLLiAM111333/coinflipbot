const { Client, Message } = require('discord.js');
const { User } = require('../../db/models/User');

/**
 * @param {Client} client
 * @param {Message} message
 */
module.exports = async (client, message) => {
  if(message.author.bot) return;

  const startsWithPrefix = message.content.startsWith(client.prefix)

  const args = startsWithPrefix
    ? message.content.slice(client.prefix.length).split(/ +/)
    : message.content.split(/ +/);

  const command = args.shift().toLowerCase();
  const cmd = client.commands.get(command);

  if(startsWithPrefix && cmd) {
    cmd.run(client, message, args)
  } else {
    const user = await User.findOne({ id: message.author.id });

    if(!user) {
      const newUser = new User({
        tag: message.author.tag,
        id: message.author.id,
        wins: 0,
        losses: 0,
        winRate: '0%'
      });

      await newUser.save();
    }
  }
}
