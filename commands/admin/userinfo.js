// commands/userinfo.js
const { SlashCommandBuilder } = require('discord.js');
const { query } = require('../../src/database/db');


module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Affiche les infos BDD d\'un user')
    .addUserOption(opt => 
      opt.setName('cible')
        .setDescription('Utilisateur visé')
        .setRequired(true)
    ),
  async execute(interaction) {
    const user = interaction.options.getUser('cible');
    try {
      const result = await query('SELECT * FROM users WHERE discord_id = $1', [user.id]);
      if (result.rows.length === 0) {
        return interaction.reply({ content: `Aucun enregistrement pour ${user.tag}`, ephemeral: true });
      }
      const row = result.rows[0];
      return interaction.reply({ content: `ID BDD : ${row.id}\nDiscord : ${row.discord_id}\nUsername : ${row.username}\nDate : ${row.joined_at}` });
    } catch (err) {
      console.error(err);
      return interaction.reply({ content: 'Erreur lors de la récupération en BDD.', ephemeral: true });
    }
  }
};
