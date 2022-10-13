import { Message } from "discord.js";
import { CoinflipClient } from "../../lib/discord/client/CoinflipClient";
import { Command } from "../../lib/discord/command/Command";

export default class extends Command {
  public constructor() {
    super({
      name: 'dev',
      description: 'development command',
      category: 'utility',
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
  }

  public run(client: CoinflipClient, message: Message, args: Array<string>): void {
    message.channel.send({ content: 'xd' })
  }
}
