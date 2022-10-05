import { Snowflake } from "discord.js";

export interface IConfig {
  guildID: Snowflake;
  logChannelID: Snowflake;
  adminRole: Snowflake;
  wardenRole: Snowflake;
  gulagRole: Snowflake;
  gulagChannel: Snowflake;
  ignoredPersonalRoles: Array<Snowflake>;
}
