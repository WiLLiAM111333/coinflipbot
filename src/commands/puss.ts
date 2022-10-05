import { join } from "path";
import { PussAnswer } from "../../db/models/PussAnswer.model";
import { EmbedBuilder, Message } from "discord.js";
import { CoinflipClient } from "../../lib/discord/client/CoinflipClient";
import { Command } from "../../lib/discord/command/Command";
import { readdir } from "fs/promises";

export default class extends Command {
  public constructor() {
    super({
      name: 'puss',
      description: 'Preprogrammed puss personality reply',
      aliases: ['turkmode'],
      category: 'fun',
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
  }

  public async run(client: CoinflipClient, message: Message, args: Array<string>): Promise<unknown> {
    try {
      if(args.shift() === 'add' && (message.author.id === '107424723050180608' || message.author.id === '216854420854407168')) {
        if(!args.length) {
          const embed = new EmbedBuilder()
            .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
            .setColor('#ff0000')
            .setDescription('You must provide a text for the database to save!');

          return message.channel.send({ embeds: [ embed ] });
        }

        try {
          const newAnswer = new PussAnswer({
            text: args.join(' ')
          });

          await newAnswer.save();

          const embed = new EmbedBuilder()
            .setColor('Random')
            .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
            .setDescription('Saved quote to database');

          return message.channel.send({ embeds: [ embed ] });
        } catch (err) {
          console.error(err);

          const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
            .setDescription('Could not save quote to database');

          return message.channel.send({ embeds: [ embed ] });
        }
      }

      const pussPath = join(__dirname, '..', '..', '..', 'assets', 'puss');
      const personalities = [
        'Bruce Wayne',
        'Ezio',
        'Kylo Ren',
        'Muhammad Ali',
        'Octopuss',
        'PalpaTurk',
        'Pepe Gandalf',
        'Pepe Potter',
        'Walter White',
        'ww2',
        'Yoker'
      ];

      const randomPersonality = personalities[Math.floor(Math.random() * personalities.length)];
      const personalityPath = join(pussPath, randomPersonality.replace(/\s/, ''));
      const dir = await readdir(personalityPath);

      let pfpFormat;

      for(const file of dir) {
        const [ name, extension ] = file.split('.');

        if(name === 'pfp') {
          pfpFormat = extension;
        }
      }

      if(!pfpFormat) {
        const embed = new EmbedBuilder()
          .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
          .setColor('#ff0000')
          .setDescription('There was no pfp saved for this personality, BLAME WILLIAM!')

        return message.channel.send({ embeds: [ embed ] });
      }

      const pfpPath = join(personalityPath, `pfp.${pfpFormat}`);

      const randomGif = join(
        personalityPath,
        (dir.filter(file => file !== `pfp.${pfpFormat}`))[Math.floor(Math.random() * (dir.length - 1 < 0 ? 0 : dir.length - 1))]
      );

      const allAnswers = await PussAnswer.find();
      const randomAnswer = allAnswers[Math.floor(Math.random() * allAnswers.length)].text;

      const personalityName = randomPersonality === 'ww2'
        ? 'REDACTED'
        : randomPersonality;

      const files = [ pfpPath ];

      const embed = new EmbedBuilder()
        .setAuthor({ name: personalityName, iconURL: `attachment://pfp.${pfpFormat}` })
        .setDescription(randomAnswer)
        .setColor('Random')
        .setImage(`attachment://${randomGif.split(/\\|\//).pop()}`)

      if(randomGif) {
        files[files.length] = randomGif;
      }

      message.channel.send({ embeds: [ embed ], files })
    } catch (err) {
      console.error(err);

      if(err?.httpStatus === 443) return;
    }
  }
}
