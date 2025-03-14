const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { token } = require('./config.json');
const logger = require('./logger');

// 🖥️ Création du client
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// 📂 Collections de commandes
client.commands = new Collection();

// 🔄 Chargement des commandes & événements
const loadCommands = require('./loaders/commandLoader');
const loadEvents = require('./loaders/eventLoader');

loadCommands(client);
loadEvents(client);

// ✅ Connexion du bot
client.login(token).then(() => {
  logger.info('Bot démarré et connecté à Discord ! 🚀');
}).catch(error => {
  logger.error(`Erreur lors de la connexion du bot : ${error}`);
});
