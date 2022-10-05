import { Config } from "../../db/models/Config.model";
import { IConfig } from "./IConfig";
import { Snowflake } from "discord.js";

export class ConfigManager {
  public constructor() {};

  public async get(guildID: Snowflake) {
    try {
      return await Config.find({ guildID });
    } catch (err) {
      throw err;
    }
  }

  public async getOne(guildID: Snowflake) {
    try {
      return await Config.findOne({ guildID });
    } catch (err) {
      throw err;
    }
  }

  public async getOrCreate({ guildID }: Optional<IConfig>) {
    try {
      return await Config.findOne({ guildID }) ?? await this.create({ guildID });
    } catch (err) {
      throw err;
    }
  }

  public async create({ guildID }: Optional<IConfig>) {
    try {
      return await new Config({ guildID }).save();
    } catch (err) {
      throw err;
    }
  }
}
