import { Client, ClientOptions, Snowflake, User } from "discord.js";
import { CommandHandler } from "../command/CommandHandler";
import { EventHandler } from "../event/EventHandler";
import { ModerationLogger } from "../logger/ModerationLogger";

export class CoinflipClient extends Client {
  public logger: ModerationLogger;
  public owners: Array<string>;
  public commandHandler: CommandHandler;
  private eventHandler: EventHandler;
  public snipes: Map<Snowflake, { content: string, author: User }>;
  public editSnipes: Map<Snowflake, { oldContent: string; newContent: string }>;

  public constructor(options: ClientOptions) {
    super(options);

    this.snipes = new Map();
    this.editSnipes = new Map();
    this.logger = new ModerationLogger(this);
    this.commandHandler = new CommandHandler(this);
    this.eventHandler = new EventHandler(this, options.eventPath);
    this.owners = [ '107424723050180608' ];

    this.eventHandler.loadEvents();
  }
}
