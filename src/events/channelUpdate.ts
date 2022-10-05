import { Awaitable, NonThreadGuildBasedChannel } from "discord.js";
import { CoinflipClient } from "../../lib/discord/client/CoinflipClient";
import { Event } from "../../lib/discord/event/Event";

export default class extends Event<'channelUpdate'> {
  public constructor() {
    super('channelUpdate');
  }

  public callback(client: CoinflipClient, oldChannel: NonThreadGuildBasedChannel, newChannel: NonThreadGuildBasedChannel): Awaitable<void> {
    client.logger.handleChannelUpdate(oldChannel, newChannel);
  }
}
