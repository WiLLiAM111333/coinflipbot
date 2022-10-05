import { Awaitable, GuildEmoji } from "discord.js";
import { CoinflipClient } from "../../lib/discord/client/CoinflipClient";
import { Event } from "../../lib/discord/event/Event";

export default class extends Event<'emojiDelete'> {
  public constructor() {
    super('emojiDelete');
  }

  public callback(client: CoinflipClient, emote: GuildEmoji): Awaitable<void> {
    client.logger.handleEmojiDelete(emote);
  }
}

