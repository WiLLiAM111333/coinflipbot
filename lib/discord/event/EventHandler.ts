import { CoinflipClient } from "../client/CoinflipClient";
import { join } from 'path';
import { readdir} from 'fs/promises';
import { Event } from "./Event";
import { ClientEvents } from "discord.js";

export class EventHandler {
  private client: CoinflipClient;
  private eventPath: string;

  public constructor(client: CoinflipClient, eventPath: string) {
    this.client = client;
    this.eventPath = eventPath;
  }

  public async loadEvents(): Promise<void> {
    try {
      const files = await readdir(this.eventPath);

      for(const file of files) {
        const eventFile = join(this.eventPath, file);

        const { default: EventClass } = await import(eventFile);
        const event: Event<keyof ClientEvents> = new EventClass();

        this.client.on(event.name, event.callback.bind(null, this.client));
      }
    } catch (err) {
      this.client.emit('error', err);
    }
  }
}
