const { SlashCommandBuilder } = require('discord.js');
const { version } = require('../../package.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Affiche des informations sur le bot.'),
  async execute(interaction) {
    await interaction.reply({ content: `🤖 **Bot**: ${interaction.client.user.username}\n🆙 **Version**: ${version}`, ephemeral: true });
  },
};
