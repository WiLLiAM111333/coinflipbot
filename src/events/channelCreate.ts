import { Awaitable, GuildChannel } from "discord.js";
import { CoinflipClient } from "../../lib/discord/client/CoinflipClient";
import { Event } from "../../lib/discord/event/Event";

export default class extends Event<'channelCreate'> {
  public constructor() {
    super('channelCreate');
  }

  public callback(client: CoinflipClient, channel: GuildChannel): Awaitable<void> {
    client.logger.handleChannelCreate(channel);
  }
}

