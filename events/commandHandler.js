  // handlers/commandHandler.js
  const fs = require('fs');
  const path = require('path');

  module.exports = (client) => {
    const commandPath = path.join(__dirname, '../commands');
    fs.readdirSync(commandPath).forEach(file => {
      const command = require(`${commandPath}/${file}`);
      client.commands.set(command.data.name, command);
    });
  };
