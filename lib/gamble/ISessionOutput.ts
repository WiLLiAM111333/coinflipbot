import { Snowflake } from "discord.js";

type ArrType = Array<{ userID: Snowflake, amount: number  }>;

export interface ISessionOutput {
  hostUserID: Snowflake;
  winners: ArrType;
  losers: ArrType;
}
