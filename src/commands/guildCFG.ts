import { EmbedBuilder, Message } from "discord.js";
import { CoinflipClient } from "../../lib/discord/client/CoinflipClient";
import { Command } from "../../lib/discord/command/Command";
import { DiscordValidator } from '../../lib/discord/DiscordValidator';
import { DiscordFormatter } from "../../lib/discord/DiscordFormatter";
import { ConfigManager } from "../../lib/config/ConfigManager";

const { validateSnowflake } = DiscordValidator;
const { inlineCodeBlock, link, bold } = DiscordFormatter;

export default class extends Command {
  private configManager: ConfigManager;

  public constructor() {
    super({
      name: 'guild-cfg',
      description: 'Configures x property on the server',
      aliases: ['guildcfg', 'gcfg'],
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
      userPerms: [
        'SendMessages',
        'Administrator'
      ]
    });

    this.configManager = new ConfigManager();
  }

  public async run(client: CoinflipClient, message: Message, args: Array<string>): Promise<any> {
    const allowedQueries = ['update', 'display'];

    const query = args[0]?.toLowerCase();
    const key = args[1];

    const allowedKeys = {
      logChannel: { multiple: false },
      adminRole: { multiple: false },
      wardenRole: { multiple: false },
      gulagRole: { multiple: false },
      gulagChannel: { multiple: false },
      ignoredPersonalRoles: { multiple: true }
    }

    if(!query || !allowedQueries.includes(query)) {
      const embed = new EmbedBuilder()
        .setAuthor({ name: 'ERROR' })
        .setColor('#ff0000')
        .setDescription(`Please provide a valid sub-command. Valid subcommands: ${
          allowedQueries.reduce((str, _query, index) => str += `${inlineCodeBlock(_query)}${index < allowedQueries.length - 1 ? ', ' : ''}`, '')
        }`);

      return message.channel.send({ embeds: [ embed ] });
    }

    try {
      const guildID = message.guild.id;
      const guildCFG = await this.configManager.getOrCreate({ guildID });
      const hasAdminRole = message.member.roles.cache.has(guildCFG.adminRole);

      if(!message.member.permissions.has('Administrator') && !hasAdminRole) {
        const embed = new EmbedBuilder()
          .setAuthor({ name: 'ERROR' })
          .setColor('#ff0000')
          .setDescription('You are not allowed to use this command!');

        return message.channel.send({ embeds: [ embed ] });
      }

      switch(query) {
        case 'update':
          {
            const cfgKey = Object.keys(allowedKeys).find(_key => new RegExp(_key, 'i').test(key));
            const keyConfig = allowedKeys[key];

            if(!key || typeof keyConfig === 'undefined') {
              const embed = new EmbedBuilder()
                .setAuthor({ name: 'ERROR' })
                .setColor('#ff0000')
                .setDescription(`Please provide a valid config property to edit. Valid properties:\n  - ${
                  Object.keys(allowedKeys).join('\n  - ')
                }`);

              return message.channel.send({ embeds: [ embed ] });
            }

            if(keyConfig.multiple) {
              const values = args.slice(2);

              if(!values.length) {
                const embed = new EmbedBuilder()
                  .setAuthor({ name: 'ERROR' })
                  .setColor('#ff0000')
                  .setDescription(`Please provide one or more values to the property separated by a space. Example: ${inlineCodeBlock('value1 value2 value3')}`);

                return message.channel.send({ embeds: [ embed ] });
              }

              for(const value of values) {
                if(!validateSnowflake(value)) {
                  const embed = new EmbedBuilder()
                    .setAuthor({ name: 'ERROR' })
                    .setColor('#ff0000')
                    .setDescription(`Please provide a valid ID! ${link('Click Here', 'https://www.remote.tools/remote-work/how-to-find-discord-id')} if you dont know how to copy an ID.`);

                  return message.channel.send({ embeds: [ embed ] });
                }
              }

              guildCFG[cfgKey] = values;
            } else {
              const value = args[2]?.toLowerCase();

              if(!value) {
                const embed = new EmbedBuilder()
                  .setAuthor({ name: 'ERROR' })
                  .setColor('#ff0000')
                  .setDescription('Please provide a value to the property');

                return message.channel.send({ embeds: [ embed ] });
              }

              if(!validateSnowflake(value)) {
                const embed = new EmbedBuilder()
                  .setAuthor({ name: 'ERROR' })
                  .setColor('#ff0000')
                  .setDescription(`Please provide a valid ID! ${link('Click Here', 'https://www.remote.tools/remote-work/how-to-find-discord-id')} if you dont know how to copy an ID.`);

                return message.channel.send({ embeds: [ embed ] });
              }

              guildCFG[cfgKey] = value;
            }

            const oldCFG = guildCFG;
            await guildCFG.save();

            const embed = new EmbedBuilder()
              .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
              .setColor('#2ae600')
              .setDescription('Successfully edited the config!')
              .setTimestamp(new Date());

            message.channel.send({ embeds: [ embed ] });
            client.emit('configUpdate', message.author, oldCFG, guildCFG);
          }
        break;

        case 'display':
          {
            let str = '';

            for(const key in allowedKeys) {
              const cfgData = guildCFG[key];

              if(Array.isArray(cfgData)) {
                str += `${inlineCodeBlock(key)} ${bold(':')}\n ${bold('-')} ${cfgData.map(index => inlineCodeBlock(index)).join(`\n${bold('-')} `)}`
              } else {
                str += `${inlineCodeBlock(key)} ${bold(':')} ${inlineCodeBlock(guildCFG[key])}\n`;
              }
            }

            const embed = new EmbedBuilder()
              .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL()})
              .setColor('#2ae600')
              .setDescription(`Config for ${bold(message.guild.name)}:\n\n${str}`);

            message.channel.send({ embeds: [ embed ] });
          }
        break;
      }
    } catch (err) {
      console.error(err); // xd
    }
  }
}
