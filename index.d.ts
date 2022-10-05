import 'discord.js';
import { CoinflipClient } from './lib/discord/client/CoinflipClient';

declare module 'discord.js' {
  export interface ClientOptions {
    eventPath: string;
  }

  export interface Message {
    client: CoinflipClient;
  }
}
