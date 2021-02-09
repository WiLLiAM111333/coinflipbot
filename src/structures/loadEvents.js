const { readdir } = require('fs/promises');
const { join } = require('path');

exports.loadEvents = client => {
  (async () => {
    const path = join(__dirname, '..', 'client', 'events');
    const files = await readdir(path);

    for(const file of files) {
      const fileName = file.split('.')[0];
      const event = require(`${path}/${fileName}`);

      client.on(fileName, event.bind(null, client));
    }

    return null;
  })();
}
