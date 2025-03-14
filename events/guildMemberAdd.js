// events/guildMemberAdd.js
const { query } = require('../database/db'); // chemin selon votre orga

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    try {
      await query(`
        INSERT INTO users (discord_id, username, joined_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (discord_id) DO NOTHING
      `, [member.id, member.user.tag]);

      console.log(`Nouvel utilisateur : ${member.user.tag} inséré en BDD.`);
    } catch (error) {
      console.error('Erreur lors de l\'insertion en BDD :', error);
    }
  },
};
