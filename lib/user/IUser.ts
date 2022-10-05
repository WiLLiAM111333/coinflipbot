import { Snowflake } from "discord.js";

export interface IUser {
  tag: string;
  id: Snowflake;
  wins: number;
  losses: number;
  winRate: string;
  personalRole: string;
}
