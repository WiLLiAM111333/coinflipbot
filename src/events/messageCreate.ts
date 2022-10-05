import { Awaitable, Message } from "discord.js";
import { CoinflipClient } from "../../lib/discord/client/CoinflipClient";
import { Event } from "../../lib/discord/event/Event";

export default class extends Event<'messageCreate'> {
  public constructor() {
    super('messageCreate');
  }

  public callback(client: CoinflipClient, message: Message): Awaitable<void> {
    if(message.author.bot) return;

    if(message.author.id === '107424723050180608') { // Temporary for development
      const { prefix } = client.commandHandler;

      const hasPrefix = message.content.startsWith(prefix);

      const args = hasPrefix
        ? message.content.slice(prefix.length).split(/ +/)
        : message.content.split(/ +/);

      const command = args.shift()?.toLowerCase();

      if(hasPrefix && command && client.commandHandler.hasCommand(command)) {
        client.commandHandler.execute(command, message, args);
      }
    }
  }
}
