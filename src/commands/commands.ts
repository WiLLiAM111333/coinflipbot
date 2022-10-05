import { EmbedBuilder, Message } from "discord.js";
import { CoinflipClient } from "../../lib/discord/client/CoinflipClient";
import { Command } from "../../lib/discord/command/Command";

export default class extends Command {
  public constructor() {
    super({
      name: 'commands',
      description: 'It lists commands... What else do you need to know?',
      aliases: ['c'],
      category: 'utility',
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
  }

  public async run(client: CoinflipClient, message: Message, args: Array<string>): Promise<void> {
    const { commands, prefix } = client.commandHandler;

    const embed = new EmbedBuilder()
      .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL()})
      .setColor('Random')
      .setDescription(`${prefix}${[...commands.keys()].join(`\n${prefix}`)}`)

    message.channel.send({ embeds: [ embed ] });
  }
}
