import { Awaitable, NonThreadGuildBasedChannel } from "discord.js";
import { CoinflipClient } from "../../lib/discord/client/CoinflipClient";
import { Event } from "../../lib/discord/event/Event";

export default class extends Event<'channelDelete'> {
  public constructor() {
    super('channelDelete');
  }

  public callback(client: CoinflipClient, channel: NonThreadGuildBasedChannel): Awaitable<void> {
    client.logger.handleChannelDelete(channel);
  }
}

