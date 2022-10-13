import { readdir, lstat         } from 'fs/promises';
import { join                   } from 'path';
import { CoinflipClient         } from "../client/CoinflipClient";
import { Command                } from "./Command";
import { CommandErrorEmbed      } from "./CommandErrorEmbed";
import { Constants              } from '../../../util/Constants';
import {
  Message,
  EmbedBuilder,
  GuildMember,
  PermissionResolvable,
  Collection,
} from "discord.js";

const { EmbedColors } = Constants;
const { RED } = EmbedColors

export class CommandHandler {
  private client: CoinflipClient;
  private commandPath: string;
  public commands: Map<string, Command>;
  public prefix: string;

  public constructor(client: CoinflipClient) {
    this.client = client;
    this.prefix = '!'

    this.commands = new Map();

    this.commandPath = join(
      __dirname,
      '..',
      '..',
      '..',
      'src',
      'commands'
    );

    this.loadCommands(this.commandPath, client);
  }

  private missingPermissionsEmbed(member: GuildMember, neededPerms: Array<PermissionResolvable>): EmbedBuilder {
    const missing = member.permissions.missing(neededPerms)
      .map(perm => `${perm},`).join('\n');

    const embed = new EmbedBuilder()
      .setDescription(`\`${missing}\``)
      .setColor(RED)
      .setAuthor({ name: `${member.id === member.guild.members.me.id ? 'I' : 'You'} need the permissions below to use this command!` });

    return embed;
  }

  public setPrefix(prefix: string): void {
    this.prefix = prefix; // TODO: DB Config
  }

  public hasCommand(command: string): boolean {
    return this.commands.has(command)
  }

  public validate(client: CoinflipClient, command: Command, message: Message): Promise<{ success: boolean, reason?: string }> {
    return new Promise((resolve, reject) => {
      const { member: executor, guild } = message;
      const clientMember = guild.members.me;

      const { ignoreBots } = command.options;
      const { ownerOnly, clientPerms, userPerms } = command.requirements;

      //? Should be able to remove this line by doing a better job in messageCreate event
      if(!ignoreBots && executor.id === client.user.id) {
        reject({ success: false });
      }

      if(ownerOnly && !client.owners.includes(executor.id) /* TODO - Replace client.owners with a configurable owner store */) {
        reject({
          success: false,
          reason: 'Command is restricted to the bot owners'
        });
      }

      if(!executor.permissions.has(userPerms)) {
        message.channel.send({ embeds: [ this.missingPermissionsEmbed(executor, userPerms) ] });

        reject({
          success: false,
          reason: `User missing permissions`
        });
      }

      if(!clientMember.permissions.has(clientPerms)) {
        message.channel.send({ embeds: [ this.missingPermissionsEmbed(clientMember, clientPerms) ] });

        reject({
          success: false,
          reason: 'Client missing permissions'
        });
      }

      resolve({ success: true })
    });
  }

  public execute(command: string, message: Message, args: Array<string>): void {
    const cmd = this.commands.get(command);

    this.validate(this.client, cmd, message)
      .then(({ success }) => {
        if(success) {
          cmd.run(this.client, message, args);
        }
      })
      .catch(err => { throw err })
  }

  public help(command: string, message: Message, mention?: boolean): void {
    mention ??= false;
    const cmd = this.commands.get(command);

    if(!cmd) {
      const embed = new CommandErrorEmbed(command, `\`${command}\` is not a registered command!`, this, message.author);

      message.reply({ embeds: [ embed ], allowedMentions: { repliedUser: mention } });
    } else {
      const {
        aliases,
        args,
        cooldown,
        description
      } = cmd.help;

      const {
        ownerOnly,
        clientPerms,
        userPerms
      } = cmd.requirements;

      const descriptionStr = ownerOnly
        ? `**This command is restricted to the bot owner**\n**Description**: ${description}`
        : description

      const embed = new EmbedBuilder()
        .setTitle(command.replace(/\b(\w)/, char => char.toUpperCase()))
        .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
        .setDescription(descriptionStr)
        .setColor('Random')
        .addFields(
          {
            name: 'Cooldown',
            value: `${cooldown} seconds`,
            inline: false
          },
          {
            name: 'Aliases',
            value: aliases.reduce((str, alias, index) => str += `\`${alias}\`${index < aliases.length - 1 ? ', ' : ''}`,''),
            inline: false
          },
          {
            name: 'Arguments',
            value: args.reduce((str, [ name, description ], index) => str += `**${name}** : **${description}**${index < args.length - 1 ? '\n' : ''}`,''),
            inline: false
          },
          {
            name: 'The bot requires the following permissions',
            value: clientPerms.reduce((str, perm, index) => str += `${perm.replace(/\b(\w)/g, char => char.toUpperCase())}${index < clientPerms.length - 1 ? ', ' : ''}`, ''),
            inline: false
          },
          {
            name: 'You need the following permissions',
            value: userPerms.reduce((str, perm, index) => str += `${perm.replace(/\b(\w)/g, char => char.toUpperCase())}${index < userPerms.length - 1 ? ', ' : ''}`, ''),
            inline: false
          }
        );

      message.reply({ embeds: [ embed ], allowedMentions: { repliedUser: mention } });
    }
  }

  public async loadCommands(dir: string, client: CoinflipClient): Promise<void> {
    try {
      for(const file of await readdir(dir)) {
        const next = join(dir, file);

        if((await lstat(next)).isDirectory()) {
          this.loadCommands(next, client);
        } else {
          const { default: Command } = await import(next);
          const command = new Command();
          const name: string = command.help.name;

          if(command.help.aliases) {
            for(const cmdAlias of command.help.aliases) {
              this.commands.set(cmdAlias, command);
            }
          }

          this.commands.set(name, command);
        }
      }
    } catch(err) {
      this.handleError(err);
    }
  }

  private handleError(error: unknown): void {
    console.log(error);
  }
}
