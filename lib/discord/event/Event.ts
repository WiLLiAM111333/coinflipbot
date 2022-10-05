import { Awaitable, ClientEvents } from 'discord.js';
import { CoinflipClient } from '../client/CoinflipClient';

export abstract class Event<T extends keyof ClientEvents> {
  public name: T;
  public abstract callback(client: CoinflipClient, ...args: ClientEvents[T]): Awaitable<void>;

  public constructor(name: T) {
    this.name = name;
  }
}
