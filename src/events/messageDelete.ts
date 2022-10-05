import { Awaitable, Message } from "discord.js";
import { CoinflipClient } from "../../lib/discord/client/CoinflipClient";
import { Event } from "../../lib/discord/event/Event";

export default class extends Event<'messageDelete'> {
  public constructor() {
    super('messageDelete');
  }

  public callback(client: CoinflipClient, message: Message): Awaitable<void> {
    client.snipes.set(message.channel.id, {
      content: message.content,
      author: message.author
    });

    client.logger.handleMessageDelete(message);
  }
}
