import { Awaitable, Sticker } from "discord.js";
import { CoinflipClient } from "../../lib/discord/client/CoinflipClient";
import { Event } from "../../lib/discord/event/Event";

export default class extends Event<'stickerUpdate'> {
  public constructor() {
    super('stickerUpdate');
  }

  public callback(client: CoinflipClient, oldSticker: Sticker, newSticker: Sticker): Awaitable<void> {
    client.logger.handleStickerUpdate(oldSticker, newSticker);
  }
}
