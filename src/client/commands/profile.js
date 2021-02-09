const { MessageEmbed } = require('discord.js');
const { User } = require('../../db/models/User');
const stripIndent = require('strip-indent');

exports.run = async (client, message, args) => {
  const memberData = message.mentions.members.first() || message.member;
  const userData = memberData.user;
  const avatarURL = userData.displayAvatarURL({ dynamic: true });
  const gameData = await User.findOne({ id: userData.id });

  if(!gameData) {
    message.channel.send('No gamedata found for this user... New profile created, please try again');

    const newUser = new User({
      tag: userData.tag,
      id: userData.id,
      wins: 0,
      losses: 0,
      winRate: '0%'
    });

    await newUser.save();
  } else {
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
        **Status**: \`${userData.presence.status}\`

        **Wins**: \`${gameData.wins}\`
        **Losses**: \`${gameData.losses}\`
        **Winrate**: \`${gameData.winRate}\`
      `));

    message.channel.send(embed);
  }
}

exports.help = {
  name: 'profile',
  description: 'Sends a profile with user data and stats',
  aliases: ['p']
}
