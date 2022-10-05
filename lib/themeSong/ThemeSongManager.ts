import { Snowflake } from "discord.js";
import { Document } from "mongoose";
import { ThemeSong } from "../../db/models/ThemeSong.model";

export class ThemeSongManager {
  public constructor() {};

  public async has(guildID: Snowflake, userID: Snowflake): Promise<boolean> {
    return (await ThemeSong.find({ guildID, userID })).length > 0;
  }

  public async get(guildID: Snowflake, userID: Snowflake) {
    return await ThemeSong.findOne({ guildID, userID });
  }

  public async create(guildID: Snowflake, userID: Snowflake, song: string): Promise<void> {
    const newSong = new ThemeSong({ guildID, userID, song });

   await newSong.save();
  }

  public async update(guildID: Snowflake, userID: Snowflake, newSong: string): Promise<void> {
    const hasThemeSong = await this.has(guildID, userID);

    if(hasThemeSong) {
      const song = await ThemeSong.findOne({ guildID, userID });

      song.song = newSong;

      await song.save();
    }
  }

  public async delete(guildID: Snowflake, userID: Snowflake): Promise<void> {
    ThemeSong.deleteOne({ guildID, userID });
  }
}
