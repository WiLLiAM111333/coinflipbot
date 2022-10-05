import { Awaitable, Message } from "discord.js";
import { CoinflipClient } from "../../lib/discord/client/CoinflipClient";
import { Event } from "../../lib/discord/event/Event";

export default class extends Event<'messageUpdate'> {
  public constructor() {
    super('messageUpdate');
  }

  public callback(client: CoinflipClient, oldMessage: Message, newMessage: Message): Awaitable<void> {
    if(newMessage && newMessage?.content) {
      client.editSnipes.set(newMessage.channel.id, {
        oldContent: oldMessage.content,
        newContent: newMessage.content
      });
    }
  }
}
