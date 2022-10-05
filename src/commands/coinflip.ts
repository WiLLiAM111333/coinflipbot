import stripIndent from 'strip-indent';
import { EmbedBuilder, Message } from "discord.js";
import { CoinflipClient } from "../../lib/discord/client/CoinflipClient";
import { Command } from "../../lib/discord/command/Command";
import { UserManager } from "../../lib/user/UserManager";
import { DiscordFormatter } from "../../lib/discord/DiscordFormatter";
import { Util } from '../../util/Util';
import { Constants } from '../../util/Constants';

const { bold, inlineCodeBlock } = DiscordFormatter;
const { COINFLIP_IMAGES } = Constants;

export default class extends Command {
  private userManager: UserManager;

  public constructor() {
    super({
      name: 'coinflip',
      description: 'flips the coin',
      aliases: ['soloq', 'flip', 'cf', 'f'],
      args: [['guess', 'which side of the coin you want to guess']],
      category: 'fun',
      cooldown: 0,
      ignoreBots: false,
      ownerOnly: false,
      clientPerms: [
        'SendMessages',
        'EmbedLinks',
        'AttachFiles',
        'ViewChannel'
      ],
      userPerms: [ 'SendMessages' ]
    });

    this.userManager = new UserManager();
  }

  public async run(client: CoinflipClient, message: Message, args: Array<string>): Promise<unknown> {
    try {
      if(!args.length) {
        const embed = new EmbedBuilder()
          .setAuthor({ name: 'ERROR' })
          .setColor('#ff0000')
          .setDescription('You need to provide a side of the coin! Examples:\n!coinflip heads\n!coinflip tails')

        return message.reply({ embeds: [ embed ] });
      }

      const guess = args[0].toLowerCase();

      if(guess !== 'heads' && guess !== 'tails') {
        const embed = new EmbedBuilder()
          .setAuthor({ name: 'ERROR' })
          .setColor('#ff0000')
          .setDescription(`${bold(guess)} is not a valid side of the coin, accepted sides are: ${bold('heads')} or ${bold('tails')}`)

        return message.reply({ embeds: [ embed ] });
      }

      const user = await this.userManager.getOrCreate({ id: message.author.id, tag: message.author.tag });

      const winningSide = Math.floor(Math.random() * 2) ? 'heads' : 'tails';
      const didWin = guess === winningSide;
      const img = COINFLIP_IMAGES[winningSide];

      didWin
        ? await Util.handleWin(user)
        : await Util.handleLoss(user);

      const embed = new EmbedBuilder()
        .setTitle(`${winningSide.replace(/\b./, char => char.toUpperCase())} won!`)
        .setAuthor({ name: `${message.author.tag} guessed ${guess} and ${didWin ? 'won' : 'lost'}`, iconURL: message.author.displayAvatarURL() })
        .setDescription(stripIndent(`
          ${bold('Wins')}: ${inlineCodeBlock(user.wins)}
          ${bold('Losses')}: ${inlineCodeBlock(user.losses)}
          ${bold('Winrate')}: ${inlineCodeBlock(user.winRate)}
        `))
        .setColor('#ffbd24')
        .setImage(`attachment://${winningSide}.png`)

      message.channel.send({ embeds: [ embed ], files: [ img ] });
    } catch (err) {
      console.error(err);
    }
  }
}
