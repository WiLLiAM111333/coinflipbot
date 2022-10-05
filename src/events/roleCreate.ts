import { Awaitable, Role } from "discord.js";
import { CoinflipClient } from "../../lib/discord/client/CoinflipClient";
import { Event } from "../../lib/discord/event/Event";

export default class extends Event<'roleCreate'> {
  public constructor() {
    super('roleCreate');
  }

  public callback(client: CoinflipClient, role: Role): Awaitable<void> {
    client.logger.handleRoleCreate(role);
  }
}

