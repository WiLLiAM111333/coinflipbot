import { ColorResolvable, EmbedBuilder, Message } from "discord.js";
import { join } from "path";
import { ItalianSwearWord } from "../../db/models/ItalianSwearWord.model";
import { CoinflipClient } from "../../lib/discord/client/CoinflipClient";
import { Command } from "../../lib/discord/command/Command";

export default class extends Command {
  public constructor() {
    super({
      name: 'ita',
      description: 'Italian swearwords and nothing else :)',
      aliases: ['crivez', 'criv'],
      category: 'fun',
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
  }

  public async run(client: CoinflipClient, message: Message, args: Array<string>): Promise<void> {
    try {
      const swearWords = await ItalianSwearWord.find();
      const randomSwearWord = swearWords[Math.floor(Math.random() * swearWords.length)];

      const assetsPath = join(__dirname, '..', '..', '..', 'assets');
      const crivStarePath = join(assetsPath, 'crivstare.png');
      const itaFlagPath = join(assetsPath, 'itaflag.png');

      const colors: Array<ColorResolvable> = ['#00bd1c', '#fafeff', '#ff2424'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const embed = new EmbedBuilder()
        .setAuthor({ name: randomSwearWord.term, iconURL: 'attachment://crivstare.png'})
        .setImage('attachment://itaflag.png')
        .setColor(randomColor);

      message.channel.send({ embeds: [ embed ], files: [ crivStarePath, itaFlagPath ] });
    } catch (err) {
      console.error(err);
    }
  }
}
