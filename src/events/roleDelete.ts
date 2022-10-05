import { Awaitable, Role } from "discord.js";
import { CoinflipClient } from "../../lib/discord/client/CoinflipClient";
import { Event } from "../../lib/discord/event/Event";

export default class extends Event<'roleDelete'> {
  public constructor() {
    super('roleDelete');
  }

  public callback(client: CoinflipClient, role: Role): Awaitable<void> {
    client.logger.handleRoleDelete(role);
  }
}

