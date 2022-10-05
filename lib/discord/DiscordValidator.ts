import { Snowflake } from 'discord.js';

export class DiscordValidator {
  private constructor() {
    throw new ReferenceError('Cannot instantiate static class DiscordValidator');
  }

  public static validateSnowflake(snowflake: Snowflake): boolean {
    return /[0-9]{0,30}/.test(snowflake);
  }
}
