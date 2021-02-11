const { MessageEmbed } = require('discord.js');
const { User } = require('../../db/models/User');
const { flipCoin, createUser, handleStandOff } = require('../../structures/functions');
const { COINFLIP_IMAGES } = require('../../structures/constants');
const stripIndent = require('strip-indent');

/**
 * @param {import('discord.js').Client} client
 * @param {import('discord.js').Message} message
 * @param {Array<string>} args
 */
exports.run = async (client, message, args) => {
  const userOne = message.member;
  const mentionedUser = message.mentions.users.first();
  const guessEmbedColor = '#1750fd';

  if(mentionedUser) {
    const userTwo = message.guild.member(mentionedUser);

    if(userTwo) {
      let userOneGameData = await User.findOne({ id: userOne.id });
      let userTwoGameData = await User.findOne({ id: userTwo.id });

      if(!userOneGameData) {
        userOneGameData = await createUser({
          tag: userOne.user.tag,
          id: userOne.user.id,
          wins: 0,
          losses: 0,
          winRate: '0%'
        });
      }

      if(!userTwoGameData) {
        userTwoGameData = await createUser({
          tag: userTwo.user.tag,
          id: userTwo.user.id,
          wins: 0,
          losses: 0,
          winRate: '0%'
        });
      }

      const guesses = [];

      const guessEmbed = new MessageEmbed()
        .setColor(guessEmbedColor)
        .setAuthor('Both players, please guess! Heads or tails?', message.guild.iconURL({ dynamic: true }))
        .setFooter('You have 10 seconds to guess');

      message.channel.send(guessEmbed);

      const filter = msg => (msg.author.id === userOne.id || msg.author.id === userTwo.id);
      const collector = message.channel.createMessageCollector(filter, { time: 10000 });

      collector.on('collect', msg => {
        const guess = msg.content.toLowerCase();

        if(guess !== 'heads' && guess !== 'tails') {
          const embed = new MessageEmbed()
            .setAuthor('ERROR')
            .setColor('#ff0000')
            .setDescription(`${guess} is not a valid side of the coin, accepted sides are: **heads** or **tails**`)

          msg.channel.send(msg.author.toString(), { embed });
        } else {
          const index = msg.author.id === userOne.id ? 0 : 1;

          if(!guesses[index]) {
            guesses[index] = guess;
          }

          if(guesses[0] && guesses[1]) {
            collector.stop();
          }
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

        const winningSide = flipCoin();
        const [userOneWin, userTwoWin] = guesses.map(guess => guess === winningSide);
        const img = COINFLIP_IMAGES[winningSide]

        if(userOneWin) {
          await handleStandOff(userOneGameData, userTwoGameData);
        }

        if(userTwoWin) {
          await handleStandOff(userTwoGameData, userOneGameData);
        }

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
