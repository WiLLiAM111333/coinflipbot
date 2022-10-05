import { Awaitable, Sticker } from "discord.js";
import { CoinflipClient } from "../../lib/discord/client/CoinflipClient";
import { Event } from "../../lib/discord/event/Event";

export default class extends Event<'stickerCreate'> {
  public constructor() {
    super('stickerCreate');
  }

  public callback(client: CoinflipClient, sticker: Sticker): Awaitable<void> {
    client.logger.handleStickerCreate(sticker);
  }
}
