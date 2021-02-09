const { Client } = require('discord.js');

const client = new Client();

client.prefix = '!';
client.commands = new Map();

require('../db/connect').connect();
require('../structures/loadCommands').loadCommands(client);
require('../structures/loadEvents').loadEvents(client)

client.login(process.env.TOKEN);
