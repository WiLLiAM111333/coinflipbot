import { Awaitable, GuildBan } from "discord.js";
import { CoinflipClient } from "../../lib/discord/client/CoinflipClient";
import { Event } from "../../lib/discord/event/Event";

export default class extends Event<'guildBanRemove'> {
  public constructor() {
    super('guildBanRemove');
  }

  public callback(client: CoinflipClient, ban: GuildBan): Awaitable<void> {
    client.logger.handleGuildBanRemove(ban);
  }
}

