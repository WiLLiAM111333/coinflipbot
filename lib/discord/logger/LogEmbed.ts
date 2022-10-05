import { APIEmbed, ColorResolvable, EmbedBuilder, EmbedData } from 'discord.js';
import { ModerationLoggerLevel } from './ModerationLoggerLevel';

export class LogEmbed extends EmbedBuilder {
  public constructor(level: ModerationLoggerLevel, data?: EmbedData | APIEmbed) {
    super(data);

    this.setColor(this.getColor(level));
    this.setTimestamp(Date.now());
  }

  private getColor(level: ModerationLoggerLevel): ColorResolvable {
    const colors: Array<ColorResolvable> = [
      '#00a35a',
      '#ffce5c',
      '#ff0000'
    ];

    return colors[level];
  }
}
