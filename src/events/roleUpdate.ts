import { Awaitable, Role } from "discord.js";
import { CoinflipClient } from "../../lib/discord/client/CoinflipClient";
import { Event } from "../../lib/discord/event/Event";

export default class extends Event<'roleUpdate'> {
  public constructor() {
    super('roleUpdate');
  }

  public callback(client: CoinflipClient, oldRole: Role, newRole: Role): Awaitable<void> {
    client.logger.handleRoleUpdate(oldRole, newRole);
  }
}

