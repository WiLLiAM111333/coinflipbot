import { Snowflake } from "discord.js";

export interface IOngoingBet {
  guildID: Snowflake;
  userID: Snowflake;
  betsPlaced: Array<{
    userID: Snowflake;
    side: GambleSideString;
    amount: number;
  }>;
}
