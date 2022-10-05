import { EmbedBuilder, Message } from "discord.js";
import { ConfigManager } from "../../lib/config/ConfigManager";
import { CoinflipClient } from "../../lib/discord/client/CoinflipClient";
import { Command } from "../../lib/discord/command/Command";
import { UserManager } from "../../lib/user/UserManager";
import { DiscordFormatter } from "../../lib/discord/DiscordFormatter";

const { link, inlineCodeBlock, bold } = DiscordFormatter;

export default class extends Command {
  private userManager: UserManager;
  private configManager: ConfigManager;

  public constructor() {
    super({
      name: 'personal-role',
      description: 'Modifies your personal role',
      aliases: ['personalrole', 'prole', 'p-role'],
      category: 'config',
      cooldown: 0,
      ignoreBots: false,
      ownerOnly: false,
      clientPerms: [
        'SendMessages',
        'EmbedLinks',
        'AttachFiles',
        'ViewChannel'
      ],
      userPerms: [ 'SendMessages' ]
    });

    this.userManager = new UserManager();
    this.configManager = new ConfigManager();
  }

  public async run(client: CoinflipClient, message: Message, args: Array<string>): Promise<unknown> {
    try {
      const allowedQueries = ['add', 'update', 'delete'];
      const query = args[0]?.toLowerCase();

      const user = await this.userManager.getOrCreate(message.author);
      const guildCFG = await this.configManager.getOrCreate({ guildID: message.guildId });

      if(!allowedQueries.includes(query)) {
        const embed = new EmbedBuilder()
          .setAuthor({ name: 'ERROR', iconURL: message.author.displayAvatarURL() })
          .setColor('#ff0000')
          .setDescription(`Please provide a valid sub-command. Valid subcommands: ${
            allowedQueries.reduce((str, _query, index) => str += `${inlineCodeBlock(_query)}${index < allowedQueries.length - 1 ? ', ' : ''}`, '')
          }`);

        return message.channel.send({ embeds: [ embed ] });
      }

      switch(query) {
        case 'add': {
          const roleID = args[1];

          if(!roleID || !(/\d{10,20}/.test(roleID))) {
            const embed = new EmbedBuilder()
              .setAuthor({ name: 'ERROR', iconURL: message.author.displayAvatarURL() })
              .setColor('#ff0000')
              .setDescription(`Please provide a valid role ID. Please ${link('click here', 'https://www.remote.tools/remote-work/how-to-find-discord-id')} if you do not know how to copy a role's ID!`);

            return message.channel.send({ embeds: [ embed ] });
          }

          const role = await message.guild.roles.fetch(roleID);

          if(!role) {
            const embed = new EmbedBuilder()
              .setAuthor({ name: 'ERROR', iconURL: message.author.displayAvatarURL() })
              .setColor('#ff0000')
              .setDescription('Could not find the given role by ID, please make sure the role exists!');

            return message.channel.send({ embeds: [ embed ] });
          }

          if(guildCFG.ignoredPersonalRoles.includes(role.id)) {
            const embed = new EmbedBuilder()
              .setAuthor({ name: 'ERROR', iconURL: message.author.displayAvatarURL() })
              .setColor('#ff0000')
              .setDescription('You are not allowed to use that as a personal role!');

            return message.channel.send({ embeds: [ embed ] });
          }

          if(role.position > message.guild.members.me.roles.highest.position) {
            const embed = new EmbedBuilder()
              .setAuthor({ name: 'ERROR', iconURL: message.author.displayAvatarURL() })
              .setColor('#ff0000')
              .setDescription('I can not give this role since the role is ranked higher than my highest ranked role!');

            return message.channel.send({ embeds: [ embed ] });
          }

          if(role.position > message.member.roles.highest.position) {
            const embed = new EmbedBuilder()
              .setAuthor({ name: 'ERROR', iconURL: message.author.displayAvatarURL() })
              .setColor('#ff0000')
              .setDescription('I can not give you this role because it is ranked higher than your highest ranked role!');

            return message.channel.send({ embeds: [ embed ] });
          }

          if(!message.member.roles.cache.has(roleID)) {
            message.member.roles.add(roleID);
          }

          user.personalRole = roleID;
          await user.save();

          const embed = new EmbedBuilder()
            .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
            .setColor('#2ae600')
            .setDescription(`Set the role ${bold(role.name)} as your personal role`);

          message.channel.send({ embeds: [ embed ] });
        } break;

        case 'update': {
          const allowedKeys = ['color', 'name'];
          const key = args[1]?.toLowerCase();
          const role = await message.guild.roles.fetch(user.personalRole);

          if(!role) {
            const embed = new EmbedBuilder()
              .setAuthor({ name: 'ERROR', iconURL: message.author.displayAvatarURL() })
              .setColor('#ff0000')
              .setDescription(`Could not find your personal role, please use ${client.commandHandler.prefix}p-role add <roleID>`);

            return message.channel.send({ embeds: [ embed ] });
          }

          if(!allowedKeys.includes(key)) {
            const embed = new EmbedBuilder()
              .setAuthor({ name: 'ERROR', iconURL: message.author.displayAvatarURL() })
              .setColor('#ff0000')
              .setDescription(`Please use a valid key. Valid keys: ${
                allowedKeys.reduce((str, _key, index) => str += `${inlineCodeBlock(_key)}${index < allowedKeys.length - 1 ? ', ' : ''}`, '')
              }`);

            return message.channel.send({ embeds: [ embed ] })
          }

          switch(key) {
            case 'color': {
              const colorInput = args[2];

              if(!(/#?([0-9A-F]{0,6})/i.test(colorInput))) {
                const embed = new EmbedBuilder()
                  .setAuthor({ name: 'ERROR', iconURL: message.author.displayAvatarURL() })
                  .setColor('#ff0000')
                  .setDescription(`Invalid hex color! ${link('Guide', 'https://www.hexcolortool.com/')}`);

                return message.channel.send({ embeds: [ embed ] });
              }

              const colorNum = parseInt(
                colorInput.startsWith('#') ? colorInput.slice(1) : colorInput,
                16
              );

              const color = colorNum < 0x01
                ? 0x01
                : colorNum > 0xFFFFFF
                  ? 0xFFFFFF
                  : colorNum;

              await role.setColor(color);

              const embed = new EmbedBuilder()
                .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                .setColor(color)
                .setDescription(`Set the color to ${inlineCodeBlock(`#${color.toString(16)}`)} on your personal role ${bold(role.name)}`)

              message.channel.send({ embeds: [ embed ] });
            } break;

            case 'name': {
              const nameInput = args.slice(2).join(' ');
              role.setName(nameInput);

              const embed = new EmbedBuilder()
                .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                .setColor('#2ae600')
                .setDescription(`Set the name to ${inlineCodeBlock(nameInput)} on your personal role ${bold(role.name)}`);

              message.channel.send({ embeds: [ embed ] });
            } break;
          }
        } break;
      }
    } catch (err) {
      console.error(err);
    }
  }
}
