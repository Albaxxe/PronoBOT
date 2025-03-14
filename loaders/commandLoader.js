const fs = require('fs');
const path = require('path');
const logger = require('../logger');

module.exports = (client) => {
  logger.info('📂 Chargement des commandes...');
  const commandsPath = path.join(__dirname, '../commands');

  // 📜 Parcourir tous les dossiers dans "commands/"
  const categories = fs.readdirSync(commandsPath).filter(folder => fs.lstatSync(path.join(commandsPath, folder)).isDirectory());

  for (const category of categories) {
    const categoryPath = path.join(commandsPath, category);
    const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      const filePath = path.join(categoryPath, file);
      const command = require(filePath);

      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        logger.info(`✅ Commande chargée : ${command.data.name} (${category})`);
      } else {
        logger.warn(`⚠️ Le fichier ${file} dans ${category} ne contient pas "data" ou "execute".`);
      }
    }
  }
};
