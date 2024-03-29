import { EmbedBuilder, User } from "discord.js";
import { CommandHandler     } from "./CommandHandler";
import { DiscordFormatter   } from '../DiscordFormatter';

const { bold } = DiscordFormatter;

export class CommandErrorEmbed extends EmbedBuilder {
  public constructor(command: string, error: string, handler: Readonly<CommandHandler>, user: User) {
    super();

    this.setColor('#ff0000');
    this.setDescription(`${error}\n\nUse the command "${bold(`${handler.prefix}help ${command}`)}" to get help with this command!`);
    this.setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() });
  }
}
