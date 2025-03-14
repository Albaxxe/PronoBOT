const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { token, clientId, guildId } = require('./config.json');
const logger = require('./logger');

// 📂 Chemin du dossier des commandes
const commandsPath = path.join(__dirname, 'commands');
const commands = [];

// 📜 Parcourir tous les sous-dossiers de "commands/"
const categories = fs.readdirSync(commandsPath).filter(folder => 
  fs.lstatSync(path.join(commandsPath, folder)).isDirectory()
);

for (const category of categories) {
  const categoryPath = path.join(commandsPath, category);
  const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(categoryPath, file);
    const command = require(filePath);

    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
      logger.info(`✅ Commande trouvée : ${command.data.name} (${category})`);
    } else {
      logger.warn(`⚠️ Le fichier ${file} dans ${category} ne contient pas "data" ou "execute".`);
    }
  }
}

// 📡 Envoi des commandes à Discord via l'API
const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    logger.info(`📤 Déploiement de ${commands.length} commandes...`);

    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
      logger.info(`✅ Commandes enregistrées sur la guilde ${guildId}.`);
    } else {
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
      logger.info('✅ Commandes enregistrées globalement.');
    }
  } catch (error) {
    logger.error(`❌ Erreur lors du déploiement des commandes : ${error}`);
  }
})();
