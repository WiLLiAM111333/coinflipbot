export class DiscordFormatter {
  private constructor() {
    throw new ReferenceError('Cannot instantiate static class DiscordFormatter');
  }

  public static bold(str: string | number | number): string {
    return `**${str}**`;
  }

  public static cursive(str: string | number): string {
    return `*${str}*`;
  }

  public static cursiveBold(str: string | number): string {
    return `***${str}***`;
  }

  public static underline(str: string | number): string {
    return `__${str}__`;
  }

  public static strikeThrough(str: string | number): string {
    return `~~${str}~~`;
  }

  public static inlineCodeBlock(str: string | number): string {
    return `\`${str}\``;
  }

  public static codeBlock(str: string | number, lang = ''): string {
    return `\`\`\`${lang}\n${str}\n\`\`\``;
  }

  public static blockQuote(str: string | number): string {
    return `> ${str}`;
  }

  public static multiLineBlockQuote(str: string | number): string {
    return `>>> ${str}`;
  }

  public static spoiler(str: string | number): string {
    return `||${str}||`;
  }

  /**
   * ONLY WORKS ON MESSAGE EMBED
   */
  public static link(name: string | number, link: string | number): string {
    return `[${name}](${link})`
  }
}
