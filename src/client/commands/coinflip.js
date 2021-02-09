const { MessageEmbed } = require('discord.js');
const { join } = require('path');
const { User } = require('../../db/models/User');
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
      const newUser = new User({
        tag: message.author.tag,
        id: message.author.id,
        wins: 0,
        losses: 0,
        winRate: '0%'
      });

      await newUser.save();
    }
  } catch (err) {
    return console.error(err);
  } finally {
    const random = Math.floor(Math.random() * 2);
    const winningSide = random ? 'heads' : 'tails';
    const didWin = guess === winningSide;

    const img = join(
      __dirname,
      '..',
      '..',
      '..',
      'assets',
      `${winningSide}.png`
    );

    try {
      if(didWin) {
        user.wins = user.wins + 1;
      } else {
        user.losses = user.losses + 1;
      }

      user.winRate = `${((user.wins * 100) / (user.wins + user.losses)).toFixed(0)}%`;

      await user.save();
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
