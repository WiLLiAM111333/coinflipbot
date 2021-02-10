const { Client, Collection } = require('discord.js');

const client = new Client();

client.prefix = '!';
client.commands = new Collection();

require('../db/connect').connect();
require('../structures/loadCommands').loadCommands(client);
require('../structures/loadEvents').loadEvents(client)

client.login(process.env.TOKEN);
