import { ThemeSongManager } from "../../lib/themeSong/ThemeSongManager";
import { EmbedBuilder, Message, User } from "discord.js";
import { CoinflipClient } from "../../lib/discord/client/CoinflipClient";
import { Command } from "../../lib/discord/command/Command";
import { DiscordFormatter } from "../../lib/discord/DiscordFormatter";

const { bold, inlineCodeBlock, codeBlock } = DiscordFormatter;

export default class extends Command {
  private themeSongManager: ThemeSongManager;

  public constructor() {
    super({
      name: 'themesong',
      description: 'Displays a members theme song',
      aliases: ['song'],
      category: 'utility',
      cooldown: 0,
      ignoreBots: false,
      ownerOnly: true,
      clientPerms: [
        'SendMessages',
        'EmbedLinks',
        'AttachFiles',
        'ViewChannel'
      ],
      userPerms: [ 'SendMessages' ]
    });

    this.themeSongManager = new ThemeSongManager();
  }

  public async run(client: CoinflipClient, message: Message, args: Array<string>): Promise<unknown> {
    const { guildId, author, mentions } = message;

    const target = mentions.members.size
      ? mentions.members.first() || mentions.users.first()
      : author;

    const targetTag = target instanceof User
      ? target.tag
      : target.user.tag;

    const targetAvatarURL = target instanceof User
      ? target.displayAvatarURL()
      : undefined

    if(args.length) {
      const query = args.shift();

      if(query && message.author.id === process.env.WILLIAM_ID) {
        switch(query) {
          case 'create': {
            try {
              if(!args.length) {
                const embed = new EmbedBuilder()
                  .setColor('#ff0000')
                  .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                  .setDescription('You need to provide a song.');

                return message.channel.send({ embeds: [ embed ] });
              }

              const song = args.shift();
              const hasThemeSong = await this.themeSongManager.has(guildId, target.id);

              if(hasThemeSong) {
                const embed = new EmbedBuilder()
                  .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                  .setColor('#ff0000')
                  .setDescription('This user already has a themesong... Use subcommand update.');

                return message.channel.send({ embeds: [ embed ] })
              }

              await this.themeSongManager.create(guildId, target.id, song);

              const embed = new EmbedBuilder()
                .setColor('#ffbd24')
                .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                .setDescription(`Successfully saved the themesong ${song} for ${targetTag}.`);

              message.channel.send({ embeds: [ embed ] });
            } catch (err) {
              const embed = new EmbedBuilder()
                .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                .setColor('#ff0000')
                .setDescription(`Error creating themesong: ${codeBlock(err)}`);

              message.channel.send({ embeds: [ embed ] });
            }
          } return;

          case 'update': {
            try {
              if(!args.length) {
                const embed = new EmbedBuilder()
                  .setColor('#ff0000')
                  .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                  .setDescription('You need to provide a song.');

                return message.channel.send({ embeds: [ embed ] });
              }

              const song = args.shift();
              const hasThemeSong = await this.themeSongManager.has(guildId, target.id);

              if(!hasThemeSong) {
                const embed = new EmbedBuilder()
                  .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                  .setColor('#ff0000')
                  .setDescription('This user has no themesong... Use the create subcommand instead.');

                return message.channel.send({ embeds: [ embed ] });
              }

              await this.themeSongManager.update(guildId, target.id, song);

              const embed = new EmbedBuilder()
                .setColor('#ffbd24')
                .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                .setDescription(`Successfully updated the themesong ${song} for ${targetTag}`);

              message.channel.send({ embeds: [ embed ] });
            } catch (err) {
              const embed = new EmbedBuilder()
                .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                .setColor('#ff0000')
                .setDescription(`Error updating themesong: ${codeBlock(err)}`);

              message.channel.send({ embeds: [ embed ] });
            }
          } return;

          case 'delete': {
            try {
              const hasThemeSong = await this.themeSongManager.has(guildId, target.id);

              if(!hasThemeSong) {
                const embed = new EmbedBuilder()
                  .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                  .setColor('#ff0000')
                  .setDescription('This user has no themesong.');

                return message.channel.send({ embeds: [ embed ] });
              }

              await this.themeSongManager.delete(guildId, target.id);

              const embed = new EmbedBuilder()
                .setColor('#ffbd24')
                .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                .setDescription(`Successfully deleted the themesong for ${targetTag}`);

              message.channel.send({ embeds: [ embed ] });
            } catch (err) {
              const embed = new EmbedBuilder()
                .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                .setColor('#ff0000')
                .setDescription(`Error deleting themesong: ${codeBlock(err)}`);

              message.channel.send({ embeds: [ embed ] });
            }
          } return;

          default: {
            const embed = new EmbedBuilder()
              .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
              .setDescription(`This subcommand is not allowed... Please use either: ${inlineCodeBlock('create')}, ${inlineCodeBlock('update')} or ${inlineCodeBlock('delete')}`);

            message.channel.send({ embeds: [ embed ] });
          }
        }
      }
    } else {
      const hasThemeSong = await this.themeSongManager.has(guildId, target.id)

      if(hasThemeSong) {
        const themeSong = await this.themeSongManager.get(guildId, target.id);

        message.channel.send({ content: `${bold(targetTag)}: ${themeSong.song}` });
      } else {
        const embed = new EmbedBuilder()
          .setAuthor({ name: targetTag, iconURL: targetAvatarURL })
          .setColor('#ff0000')
          .setDescription(`${targetTag} has no saved themesong`);

        message.channel.send({ embeds: [ embed ] })
      }
    }
  }
}
