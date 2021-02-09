const { readdir } = require('fs/promises');
const { join } = require('path');

exports.loadCommands = client => {
  (async () => {
    const path = join(__dirname, '..', 'client', 'commands');
    const files = await readdir(path);

    for(const file of files) {
      const fileName = file.split('.')[0];
      const command = require(`${path}/${fileName}`);

      client.commands.set(command.help.name, command);
    }
  })();
}
