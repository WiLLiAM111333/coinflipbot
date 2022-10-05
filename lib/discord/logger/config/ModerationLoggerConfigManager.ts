import { Snowflake } from "discord.js";
import { ModerationLoggerConfig } from "../../../../db/models/ModerationLoggerConfig.model";
import { IModerationLoggerConfig } from "./IModerationLoggerConfig";

export class ModerationLoggerConfigManager {
  public constructor() {};

  public async getConfig(guildID: Snowflake): Promise<IModerationLoggerConfig> {
    try {
      return await ModerationLoggerConfig.findOne({ guildID });
    } catch (err) {
      throw err;
    }
  }
}
