import { EmbedBuilder, Message, Snowflake, userMention } from "discord.js";
import { OngoingBet } from "../../db/models/OngoingBet.model";
import { CoinflipClient } from "../../lib/discord/client/CoinflipClient";
import { Command } from "../../lib/discord/command/Command";
import { GambleManager } from "../../lib/gamble/GambleManager";
import { PlaceBetErrors } from "../../lib/gamble/PlaceBetErrors";

export default class extends Command {
  private gambleManager: GambleManager;

  public constructor() {
    super({
      name: 'gamble',
      description: 'Gamble system master command',
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

    this.gambleManager = new GambleManager();
  }

  private async placeBetOperation(message: Message, userID: Snowflake, sessionHostID: Snowflake, betArgs: Array<string>, side: GambleSideString): Promise<void> {
    try {
      const usersCurrency = await this.gambleManager.getUsersCurrency(userID);
      const betAmount = await this.gambleManager.parseBet(userID, betArgs.join(''));

      if(usersCurrency < betAmount) {
        return super.replyError(message, this.help.name, `You cant bet ${betAmount} when you have ${usersCurrency}`)
      }

      await this.gambleManager.placeBet(sessionHostID, userID, side, betAmount);

      const embed = new EmbedBuilder()
        .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
        .setColor('#00ff00')
        .setDescription(`Set a bet of ${betAmount} on ${side}`)

      message.channel.send({ embeds: [ embed ] });
    } catch (err) {
      switch(err.code) {
        case PlaceBetErrors.SELF_BET:
          super.replyError(message, this.help.name, 'You can not bet on yourself!');
        break;

        case PlaceBetErrors.DOUBLE_BET:
          const { oldBet, newBet } = err.data;

          const embed = new EmbedBuilder()
            .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
            .setColor('#00ff00')
            .setDescription(`Moved your bet from \`${oldBet.amount}\` on \`${oldBet.side}\` to \`${newBet.amount}\` on \`${newBet.side}\``);

          message.channel.send({ embeds: [ embed ] });
        break;

        default:
          console.error(err);
      }
    }
  }

  private async concludeSessionOperation(message: Message, userID: Snowflake, side: GambleSideString) {
    try {
      const hasBetSession = await this.gambleManager.hasBetSession(userID);

      if(!hasBetSession) {
        return super.replyError(message, this.help.name, 'You do not have a session going! Create a session with the `!gamble start` command');
      }

      const { winners, losers } = await this.gambleManager.concludeSession(userID, side);

      let winnerStr = '';
      let loserStr = '';

      for(let i = 0; i < winners.length; i++) {
        const { amount, userID: winnerUserID } = winners[i];

        winnerStr += `${userMention(winnerUserID)}${i < winners.length - 1 ? '\n' : ''} wins **${amount}**`;
      }

      for(let i = 0; i < losers.length; i++) {
        const { amount, userID: loserUserID } = losers[i];

        loserStr += `${userMention(loserUserID)}${i < losers.length - 1 ? '\n' : ''} loses **${amount}**`;
      }

      const embed = new EmbedBuilder()
        .setAuthor({ name: `Team ${side} wins!`, iconURL: message.author.displayAvatarURL() })
        .setColor('#00ff00')
        .setDescription(`**Winners**:\n${winnerStr}\n\n**Losers**:\n${loserStr}`);

      message.channel.send({ embeds: [ embed ] })
      await this.gambleManager.handlePostConcludeCommandSuccess({ winners, losers, hostUserID: userID });
    } catch (err) {
      console.error(err);
    }
  }

  public async run(client: CoinflipClient, message: Message, args: Array<string>): Promise<unknown> {
    const subCommand = args.shift();
    const userID = message.author.id;

    try {
      switch(subCommand) {
        case 'start': {
          const hasBetSession = await this.gambleManager.hasBetSession(userID);

          if(hasBetSession) {
            return super.replyError(message, this.help.name, 'You already have a session going! Conclude the session with the `!gamble win` or `!gamble loss` commmand.');
          }

          const newSession = new OngoingBet({ guildID: message.guildId, userID });
          await newSession.save();

          const embed = new EmbedBuilder()
            .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
            .setColor('#00ff00')
            .setDescription('You can now gamble with `!gamble doubters` or `!gamble believers` command.')
            .setFooter({ text: 'You may not gamble on your own game!' });

          message.channel.send({ embeds: [ embed ] });
        } break;

        case 'win': {
          await this.concludeSessionOperation(message, userID, 'believers');
        } break;

        case 'loss': {
          await this.concludeSessionOperation(message, userID, 'doubters');
        } break;

        case 'believers': {
          const [ sessionHost ] = args;
          const betArgs = args.slice(1);

          const sessionHostID = /\d{10,30}/.test(sessionHost)
            ? sessionHost
            : client.users.cache.find(user => user.username.toLowerCase() === sessionHost.toLowerCase())?.id

          if(!sessionHostID) {
            return super.replyError(message, this.help.name, 'Could not find the bet host');
          }

          await this.placeBetOperation(message, userID, sessionHostID, betArgs, 'believers');
        } break;

        case 'doubters': {
          const [ sessionHost ] = args;
          const betArgs = args.slice(1);

          const sessionHostID = /\d{10,30}/.test(sessionHost)
            ? sessionHost
            : client.users.cache.find(user => user.username.toLowerCase() === sessionHost.toLowerCase())?.id

          if(!sessionHostID) {
            return super.replyError(message, this.help.name, 'Could not find the bet host');
          }

          await this.placeBetOperation(message, userID, sessionHostID, betArgs, 'doubters');
        } break;

        default:
          super.replyError(message, this.help.name, 'This is not a valid subcommand of !gamble.')
      }
    } catch (err) {
      console.error(err);
    }
  }
}
