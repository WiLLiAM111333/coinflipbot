const { MessageEmbed } = require('discord.js');
const { User } = require('../../db/models/User');
const { join } = require('path');
const stripIndent = require('strip-indent');

/**
 * @param {import('discord.js').Client} client
 * @param {import('discord.js').Message} message
 * @param {Array<string>} args
 */
exports.run = async (client, message, args) => {
  const userOne = message.member;
  const mentionedUser = message.mentions.users.first();
  const guessColor = '#1750fd';

  if(mentionedUser) {
    const userTwo = message.guild.member(mentionedUser);

    if(userTwo) {
      let userOneGameData = await User.findOne({ id: userOne.id });
      let userTwoGameData = await User.findOne({ id: userTwo.id });

      if(!userOneGameData) {
        const newUser = new User({
          tag: userOne.user.tag,
          id: userOne.user.id,
          wins: 0,
          losses: 0,
          winRate: '0%'
        });

        userOneGameData = newUser;

        await newUser.save();
      }

      if(!userTwoGameData) {
        const newUser = new User({
          tag: userTwo.user.tag,
          id: userTwo.user.id,
          wins: 0,
          losses: 0,
          winRate: '0%'
        });

        userTwoGameData = newUser;

        await newUser.save();
      }

      const guesses = [];

      const guessEmbed = new MessageEmbed()
        .setColor(guessColor)
        .setAuthor('Both players, please guess! Heads or tails?', message.guild.iconURL({ dynamic: true }))
        .setFooter('You have 10 seconds to guess');

      message.reply(guessEmbed);

      const filter = msg => (msg.author.id === userOne.id || msg.author.id === userTwo.id);
      const collector = message.channel.createMessageCollector(filter, { time: 10000 });

      collector.on('collect', msg => {
        const index = msg.author.id === userOne.id ? 0 : 1;

        if(!guesses[index]) {
          guesses[index] = msg.content.toLowerCase();
        }

        if(guesses[0] && guesses[1]) {
          collector.stop();
        }
      });

      collector.on('end', async () => {
        if(guesses.length < 2 || !guesses[0] || !guesses[1]) {
          const notEnoughGuessesEmbed = new MessageEmbed()
            .setAuthor('ERROR')
            .setColor('#ff0000')
            .setDescription('Both players did not guess!');

          return message.reply(notEnoughGuessesEmbed);
        }

        const random = Math.floor(Math.random() * 2);
        const winningSide = random ? 'heads' : 'tails';
        const [userOneWin, userTwoWin] = guesses.map(guess => guess === winningSide);

        const img = join(
          __dirname,
          '..',
          '..',
          '..',
          'assets',
          `${winningSide}.png`
        );

        if(userOneWin) {
          userOneGameData.wins = userOneGameData.wins + 1;
          userTwoGameData.wins = (userTwoGameData.wins - 1) < 0
            ? 0
            : userTwoGameData.wins - 1;
        }

        if(userTwoWin) {
          userTwoGameData.wins = userTwoGameData.wins + 1;
          userOneGameData.wins = (userOneGameData.wins - 1) < 0
            ? 0
            : userOneGameData.wins - 1;
        }

        const userOneWinrate = ((userOneGameData.wins * 100) / (userOneGameData.wins + userOneGameData.losses)).toFixed(2);
        const userTwoWinrate = ((userTwoGameData.wins * 100) / (userTwoGameData.wins + userTwoGameData.losses)).toFixed(2)

        userOneGameData.winRate = `${
          isNaN(userOneWinrate) ? 0 : userOneWinrate
        }%`;

        userTwoGameData.winRate = `${
          isNaN(userTwoWinrate) ? 0 : userTwoWinrate
        }%`;

        await userOneGameData.save();
        await userTwoGameData.save();

        const winEmbed = new MessageEmbed()
          .setTitle(`${winningSide.replace(/\b./, char => char.toUpperCase())} won!`)
          .setAuthor(userOne.user.tag, userOne.user.displayAvatarURL({ dynamic: true }))
          .setColor('#ffbd24')
          .attachFiles(img)
          .setImage(`attachment://${winningSide}.png`)
          .setDescription(stripIndent(`
            **${userOne.user.tag}** ${userOneWin ? '`won`' : '`lost`'}
            **Wins**: \`${userOneGameData.wins}\`
            **Losses**: \`${userOneGameData.losses}\`
            **Winrate**: \`${userOneGameData.winRate}\`

            **${userTwo.user.tag}** ${userTwoWin ? '`won`' : '`lost`'}
            **Wins**: \`${userTwoGameData.wins}\`
            **Losses**: \`${userTwoGameData.losses}\`
            **Winrate**: \`${userTwoGameData.winRate}\`
          `))

        message.channel.send(winEmbed)
      });
    } else {
      const noMemberFoundEmbed = new MessageEmbed()
        .setAuthor('ERROR')
        .setColor('#ff0000')
        .setDescription('No member was found... Make sure you mentioned a member of the server!');

      return message.channel.send(noMemberFoundEmbed);
    }
  } else {
    const noMentionedUserEmbed = new MessageEmbed()
      .setAuthor('ERROR')
      .setColor('#ff0000')
      .setDescription('Please mention a user to have an awesome standoff with!');

    message.channel.send(noMentionedUserEmbed);
  }
}

exports.help = {
  name: 'standoff',
  description: '1v1s 2 players',
  aliases: ['1v1']
}
