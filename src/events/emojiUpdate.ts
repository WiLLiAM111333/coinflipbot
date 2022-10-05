import { Awaitable, GuildEmoji } from "discord.js";
import { CoinflipClient } from "../../lib/discord/client/CoinflipClient";
import { Event } from "../../lib/discord/event/Event";

export default class extends Event<'emojiUpdate'> {
  public constructor() {
    super('emojiUpdate');
  }

  public callback(client: CoinflipClient, oldEmote: GuildEmoji, newEmote: GuildEmoji): Awaitable<void> {
    client.logger.handleEmojiUpdate(oldEmote, newEmote);
  }
}

