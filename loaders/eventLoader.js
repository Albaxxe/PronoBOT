// loaders/eventLoader.js
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

module.exports = (client) => {
  console.log(chalk.magenta.bold('\n===================='));
  console.log(chalk.magenta.bold('[eventLoader.js] CHARGEMENT DES ÉVÉNEMENTS'));
  console.log(chalk.magenta.bold('====================\n'));

  const eventsPath = path.join(__dirname, '../events');
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

  for (const file of eventFiles) {
    const event = require(path.join(eventsPath, file));
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
      console.log(chalk.green(`[eventLoader.js] Event (once) chargé : ${chalk.yellow(event.name)}`));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
      console.log(chalk.green(`[eventLoader.js] Event (on) chargé : ${chalk.yellow(event.name)}`));
    }
  }
  console.log(chalk.cyan(`[eventLoader.js] ${chalk.yellow(eventFiles.length)} event(s) chargé(s).`));
};
