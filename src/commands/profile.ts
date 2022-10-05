import { EmbedBuilder, Message } from "discord.js";
import stripIndent from "strip-indent";
import { CoinflipClient } from "../../lib/discord/client/CoinflipClient";
import { Command } from "../../lib/discord/command/Command";
import { UserManager } from "../../lib/user/UserManager";
import { DiscordFormatter  } from "../../lib/discord/DiscordFormatter";

const { bold, inlineCodeBlock } = DiscordFormatter;

export default class extends Command {
  private userManager: UserManager;

  public constructor() {
    super({
      name: 'profile',
      description: 'Sends a profile with user data and stats',
      aliases: ['p'],
      category: 'fun',
      cooldown: 0,
      ignoreBots: false,
      ownerOnly: true,
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

  public async run(client: CoinflipClient, message: Message, args: Array<string>): Promise<void> {
    const memberData = message.mentions.members.first() ?? message.member;
    const userData = memberData.user;

    try {
      const gameData = await this.userManager.getOrCreate(userData);
      const status = memberData.presence?.status ?? 'UNKNOWN';

      const embed = new EmbedBuilder()
        .setThumbnail(userData.displayAvatarURL())
        .setColor('#00c0f5')
        .setAuthor({ name: userData.tag })
        .setDescription(stripIndent(`
          [Avatar](${userData.avatarURL()})

          ${bold('Tag')}: ${inlineCodeBlock(userData.tag)}
          ${bold('Username')}: ${inlineCodeBlock(userData.username)}
          ${bold('Nickname')}: ${inlineCodeBlock(memberData.nickname ?? 'No nickname set')}
          ${bold('ID')}: ${inlineCodeBlock(userData.id)}
          ${bold('Status')}: ${inlineCodeBlock(status === 'dnd' ? 'Do not disturb' : status)}

          ${bold('Wins')}: ${inlineCodeBlock(gameData.wins)}
          ${bold('Losses')}: ${inlineCodeBlock(gameData.losses)}
          ${bold('Winrate')}: ${inlineCodeBlock(gameData.winRate)}
        `));

      message.channel.send({ embeds: [ embed ] });
    } catch (err) {
      console.error(err);
    }
  }
}
