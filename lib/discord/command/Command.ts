import { CommandConstructor           } from "./CommandConstructor";
import { CommandOptions               } from "./CommandOptions";
import { CommandHelp                  } from "./CommandHelp";
import { ICommand                     } from "./ICommand";
import { CommandRequirements          } from "./CommandRequirements";
import { CoinflipClient               } from "../client/CoinflipClient";
import { Message                      } from "discord.js";
import { CommandErrorEmbed            } from './CommandErrorEmbed';
import { DiscordFormatter             } from "../DiscordFormatter";

export abstract class Command implements ICommand {
  protected format: typeof DiscordFormatter;
  public requirements: CommandRequirements;
  public help: CommandHelp;
  public options: CommandOptions;

  public abstract run(client: CoinflipClient, message: Message, args: Array<string>): unknown;

  public constructor(data: CommandConstructor) {
    const {
      args,
      name,
      ownerOnly,
      aliases,
      clientPerms,
      cooldown,
      description,
      userPerms,
      ignoreBots,
      category,
    } = data;

    this.requirements = {
      ownerOnly: ownerOnly ?? true,
      clientPerms: clientPerms ?? [
        'SendMessages',
        'ViewChannel',
        'AttachFiles',
        'EmbedLinks',
        'ManageMessages'
      ],
      userPerms: userPerms ?? [
        'SendMessages',
        'ViewChannel',
        'AttachFiles',
        'EmbedLinks'
      ]
    }

    this.options = { ignoreBots: ignoreBots ?? true };

    this.help = {
      name,
      category: category ?? 'other',
      args: args ?? [],
      aliases: aliases ?? [],
      cooldown: cooldown ?? 0,
      description: description ?? 'No description set'
    }

    this.format = Object.freeze(DiscordFormatter);
  }

  protected replyError(message: Message, command: string, error: string, mention?: boolean): void {
    const embed = new CommandErrorEmbed(command, error, message.client.commandHandler, message.author);

    mention ??= false;
    message.reply({ embeds: [ embed ], allowedMentions: { repliedUser: mention } });
  }
}
