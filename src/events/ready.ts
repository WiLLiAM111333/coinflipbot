import { Awaitable } from 'discord.js';
import { CoinflipClient } from "../../lib/discord/client/CoinflipClient";
import { Event } from '../../lib/discord/event/Event';

export default class extends Event<'ready'> {
  public constructor() {
    super('ready');
  }

  public callback(client: CoinflipClient): Awaitable<void> {
    console.log(`Logged in as ${client.user.tag}`);
  }
}
