const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'ready',
  once: false, // Ce listener s'exécutera à chaque fois que le bot est prêt
  execute(client) {
    // Pour chaque serveur auquel le bot est connecté
    client.guilds.cache.forEach(guild => {
      // Créer un objet pour stocker les infos de chaque rôle
      const rolesData = {};
      guild.roles.cache.forEach(role => {
        rolesData[role.id] = {
          name: role.name,
          color: role.hexColor,
          position: role.position,
          mentionable: role.mentionable,
          hoist: role.hoist
        };
      });
      
      // Chemin vers le fichier config_roles.json dans la racine du projet
      const filePath = path.join(__dirname, '..', 'config_roles.json');
      
      // Écrire l'objet dans le fichier JSON (écrasera le contenu existant)
      fs.writeFileSync(filePath, JSON.stringify(rolesData, null, 2));
      
      console.log(`📄 [updateRoles] Roles mis à jour pour le serveur : ${guild.name} (${guild.id}). Total rôles : ${guild.roles.cache.size}`);
    });
  }
};
