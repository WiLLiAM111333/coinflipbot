import { Awaitable, Sticker } from "discord.js";
import { CoinflipClient } from "../../lib/discord/client/CoinflipClient";
import { Event } from "../../lib/discord/event/Event";

export default class extends Event<'stickerDelete'> {
  public constructor() {
    super('stickerDelete');
  }

  public callback(client: CoinflipClient, sticker: Sticker): Awaitable<void> {
    client.logger.handleStickerDelete(sticker);
  }
}
