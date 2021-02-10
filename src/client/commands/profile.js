const { MessageEmbed } = require('discord.js');
const { User } = require('../../db/models/User');
const stripIndent = require('strip-indent');

/**
 *
 * @param {*} client
 * @param {import('discord.js').Message} message
 * @param {*} args
 */
exports.run = async (client, message, args) => {
  const memberData = message.mentions.members.first() || message.member;
  const userData = memberData.user;
  const avatarURL = userData.displayAvatarURL({ dynamic: true });
  let gameData = await User.findOne({ id: userData.id });

  if(!gameData) {
    const newUser = new User({
      tag: userData.tag,
      id: userData.id,
      wins: 0,
      losses: 0,
      winRate: '0%'
    });

    gameData = newUser;

    await newUser.save();
  }

  const embed = new MessageEmbed()
    .setColor('#00c0f5')
    .setAuthor(userData.tag, avatarURL)
    .setThumbnail(avatarURL)
    .setDescription(stripIndent(`
      [Avatar](${userData.avatarURL({ dynamic: true })})

      **Tag**: \`${userData.tag}\`
      **Username**: \`${userData.username}\`
      **Nickname**: \`${memberData.nickname || 'No nickname set'}\`
      **ID**: \`${userData.id}\`
      **Status**: \`${userData.presence.status === 'dnd' ? 'Do not disturb' : userData.presence.status}\`

      **Wins**: \`${gameData.wins}\`
      **Losses**: \`${gameData.losses}\`
      **Winrate**: \`${gameData.winRate}\`
    `));

  message.channel.send(embed);
}

exports.help = {
  name: 'profile',
  description: 'Sends a profile with user data and stats',
  aliases: ['p']
}
