const fs = require('fs');
const path = require('path');
const logger = require('../logger');

/**
 * Charge toutes les commandes présentes dans le dossier ../commands
 * et les enregistre dans client.commands.
 */
module.exports = (client) => {
  logger.info('📂 Chargement des commandes...');

  // Chemin vers le dossier "commands"
  const commandsPath = path.join(__dirname, '../commands');

  // On parcourt tous les sous-dossiers de "commands"
  const categories = fs
    .readdirSync(commandsPath)
    .filter(folder => fs.lstatSync(path.join(commandsPath, folder)).isDirectory());

  for (const category of categories) {
    const categoryPath = path.join(commandsPath, category);

    // On récupère tous les fichiers .js du sous-dossier
    const commandFiles = fs
      .readdirSync(categoryPath)
      .filter(file => file.endsWith('.js'));

    // On parcourt chaque fichier de commande
    for (const file of commandFiles) {
      const filePath = path.join(categoryPath, file);
      const command = require(filePath);

      // Vérifie que la commande exporte bien "data" et "execute"
      if ('data' in command && 'execute' in command) {
        // On enregistre la commande dans la collection client.commands
        client.commands.set(command.data.name, command);
        logger.info(`✅ Commande chargée : ${command.data.name} (${category})`);
      } else {
        logger.warn(`⚠️ Le fichier "${file}" dans la catégorie "${category}" ne contient pas "data" ou "execute".`);
      }
    }
  }
};
