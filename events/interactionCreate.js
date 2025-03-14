// events/interactionCreate.js
const { Events, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Fichier de config des rôles
const permissionsFile = path.join(__dirname, '../command_permissions.json');

// Lit le JSON
function readPermissions() {
  if (!fs.existsSync(permissionsFile)) return {};
  return JSON.parse(fs.readFileSync(permissionsFile, 'utf8'));
}

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    // 1) Autocomplétion
    if (interaction.isAutocomplete()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;

      // Si la commande possède une méthode autocomplete, on l’appelle
      if (typeof command.autocomplete === 'function') {
        try {
          await command.autocomplete(interaction);
        } catch (error) {
          console.error(error);
        }
      }
      return;
    }

    // 2) Commande "slash" classique
    if (!interaction.isChatInputCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;

    // --- Vérification globale des rôles (pour TOUTES les commandes) ---
    //  => On regarde la clé "interaction.commandName" dans command_permissions.json
    const cmdName = interaction.commandName.toLowerCase(); 
    const data = readPermissions();
    const cmdConfig = data[cmdName]; 
    // "cmdConfig" doit être un objet { roles: [...] } ou un objet plus complexe (pour admin)

    if (!cmdConfig || !Array.isArray(cmdConfig.roles)) {
      // Aucune clé "cmdName" ou pas de champ "roles" => on bloque tout le monde
      return interaction.reply({
        content: "Aucune permission données pour cette commande",
        flags: MessageFlags.Ephemeral
      });
    }
    if (cmdConfig.roles.length === 0) {
      // 0 rôles => personne ne peut l'utiliser
      return interaction.reply({
        content: "Aucune permission données pour cette commande",
        flags: MessageFlags.Ephemeral
      });
    }

    // Vérifie si l'utilisateur a un des rôles
    const memberRoles = interaction.member.roles.cache.map(r => r.id);
    const hasRole = cmdConfig.roles.some(rid => memberRoles.includes(rid));
    if (!hasRole) {
      return interaction.reply({
        content: "Vous n'avez pas le droit d'utiliser cette commande",
        flags: MessageFlags.Ephemeral
      });
    }

    // --- Si tout est bon, on exécute la commande ---
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: '❌ Erreur lors de l’exécution de la commande.',
        ephemeral: true
      });
    }
  }
};
