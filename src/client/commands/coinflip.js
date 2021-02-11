const { MessageEmbed } = require('discord.js');
const { User } = require('../../db/models/User');
const {
  flipCoin,
  createUser,
  handleLoss,
  handleWin
} = require('../../structures/functions');
const { COINFLIP_IMAGES } = require('../../structures/constants');
const stripIndent = require('strip-indent');

exports.run = async (client, message, args) => {
  if(!args.length) {
    const embed = new MessageEmbed()
      .setAuthor('ERROR')
      .setColor('#ff0000')
      .setDescription('You need to provide a side of the coin! Examples:\n!coinflip heads\n!coinflip tails')

    return message.reply(embed);
  }

  const guess = args[0].toLowerCase();

  if(guess !== 'heads' && guess !== 'tails') {
    const embed = new MessageEmbed()
      .setAuthor('ERROR')
      .setColor('#ff0000')
      .setDescription(`${guess} is not a valid side of the coin, accepted sides are: **heads** or **tails**`)

    return message.reply(embed);
  }

  let user;

  try {
    user = await User.findOne({ id: message.author.id });

    if(!user) {
      user = await createUser(message.author);
    }
  } catch (err) {
    return console.error(err);
  } finally {
    const winningSide = flipCoin();
    const didWin = guess === winningSide;
    const img = COINFLIP_IMAGES[winningSide];

    try {
      didWin
        ? await handleWin(user)
        : await handleLoss(user);
    } catch (err) {
      console.error(err);
    } finally {
      const embed = new MessageEmbed()
        .setTitle(`${winningSide.replace(/\b./, char => char.toUpperCase())} won!`)
        .setAuthor(`${message.author.tag} guessed ${guess} and ${didWin ? 'won' : 'lost'}`, message.author.displayAvatarURL({ dynamic: true }))
        .setDescription(stripIndent(`
          **Wins**: \`${user.wins}\`
          **Losses**: \`${user.losses}\`
          **Winrate**: \`${user.winRate}\`
        `))
        .setColor('#ffbd24')
        .attachFiles(img)
        .setImage(`attachment://${winningSide}.png`)

      message.channel.send(embed);
    }
  }
}

exports.help = {
  name: 'coinflip',
  description: 'Flips the coin xd?',
  aliases: ['soloq', 'flip', 'cf', 'f']
}
