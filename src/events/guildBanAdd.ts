import { Awaitable, GuildBan } from "discord.js";
import { CoinflipClient } from "../../lib/discord/client/CoinflipClient";
import { Event } from "../../lib/discord/event/Event";

export default class extends Event<'guildBanAdd'> {
  public constructor() {
    super('guildBanAdd');
  }

  public callback(client: CoinflipClient, ban: GuildBan): Awaitable<void> {
    client.logger.handleGuildBanAdd(ban);
  }
}

