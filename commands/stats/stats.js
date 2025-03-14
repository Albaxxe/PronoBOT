const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Affiche les statistiques du bot.'),
  async execute(interaction) {
    const uptime = process.uptime();
    const serverCount = interaction.client.guilds.cache.size;
    const userCount = interaction.client.users.cache.size;
    await interaction.reply({
      content: `📊 **Statistiques du bot :**\n🌍 Serveurs: ${serverCount}\n👥 Utilisateurs: ${userCount}\n🆙 Uptime: ${Math.floor(uptime / 60)} minutes`,
      ephemeral: true,
    });
  },
};
