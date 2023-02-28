import { Message } from "discord.js";
import { User } from "../../db/models/User.model";
import { CoinflipClient } from "../../lib/discord/client/CoinflipClient";
import { Event } from "../../lib/discord/event/Event";

export default class extends Event<'messageCreate'> {
  public constructor() {
    super('messageCreate');
  }

  public async callback(client: CoinflipClient, message: Message): Promise<void> {
    if(message.author.bot) return;

    const { prefix } = client.commandHandler;

    const hasPrefix = message.content.startsWith(prefix);

    const args = hasPrefix
      ? message.content.slice(prefix.length).split(/ +/)
      : message.content.split(/ +/);

    const command = args.shift()?.toLowerCase();

    if(hasPrefix && command && client.commandHandler.hasCommand(command)) {
      client.commandHandler.execute(command, message, args);
    }

    const user = await User.findOne({ id: message.author.id });
    user.currency += Math.floor(Math.random() * 12);

    await user.save();
  }
}
