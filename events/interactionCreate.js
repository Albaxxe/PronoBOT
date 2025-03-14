// events/interactionCreate.js
const { MessageFlags, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, RoleSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const permissionsFile = path.join(__dirname, '..', 'command_permissions.json');

// On récupère le cache défini dans managecommands.js
// Pour plus de propreté, vous pouvez faire un cache global. Ici on le met sur globalThis par exemple.
if (!globalThis.sessionCache) {
  globalThis.sessionCache = {};
}
const sessionCache = globalThis.sessionCache;

function readPermissions() {
  if (!fs.existsSync(permissionsFile)) return {};
  return JSON.parse(fs.readFileSync(permissionsFile, 'utf8'));
}
function writePermissions(data) {
  fs.writeFileSync(permissionsFile, JSON.stringify(data, null, 2));
}

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    // Gérer les select menus
    if (interaction.isStringSelectMenu()) {
      // Vérifier l'id du menu
      if (interaction.customId === 'managecommands_selectKey') {
        // L'utilisateur a choisi la clé de commande
        const key = interaction.values[0]; // ex: "admin-moderation-manage"
        // On met à jour la session
        sessionCache[interaction.user.id].commandKey = key;
        sessionCache[interaction.user.id].step = 2; // Indique qu'on passe à l'étape suivante

        // On propose maintenant le menu pour choisir l'action (add, remove, clear)
        const rowAction = new ActionRowBuilder()
          .addComponents(
            new StringSelectMenuBuilder()
              .setCustomId('managecommands_selectAction')
              .setPlaceholder('Sélectionnez l’action...')
              .addOptions(
                {
                  label: 'list',
                  value: 'list'
                },
                {
                  label: 'add',
                  value: 'add'
                },
                {
                  label: 'remove',
                  value: 'remove'
                },
                {
                  label: 'clear',
                  value: 'clear'
                }
              )
          );
        await interaction.reply({
          content: `Vous avez choisi la clé \`${key}\`. Maintenant, sélectionnez l’action :`,
          components: [rowAction],
          ephemeral: true
        });
      }
      else if (interaction.customId === 'managecommands_selectAction') {
        // L'utilisateur a choisi l'action
        const action = interaction.values[0]; // ex: "add", "remove", "list", "clear"
        sessionCache[interaction.user.id].action = action;
        sessionCache[interaction.user.id].step = 3;

        // Si c'est "list" ou "clear", pas besoin de rôle => on exécute direct
        if (action === 'list' || action === 'clear') {
          const key = sessionCache[interaction.user.id].commandKey;
          const permissionsData = readPermissions();
          // Vérifier si la clé existe
          let data = getNestedKey(permissionsData, key);
          if (!data || !data.roles) {
            await interaction.reply({ content: `Aucune configuration trouvée pour \`${key}\`.`, ephemeral: true });
            return;
          }
          if (action === 'list') {
            if (data.roles.length === 0) {
              await interaction.reply({ content: `Aucun rôle configuré pour \`${key}\`.`, ephemeral: true });
            } else {
              await interaction.reply({
                content: `Rôles pour \`${key}\`: ${data.roles.map(r => `<@&${r}>`).join(', ')}`,
                ephemeral: true
              });
            }
          }
          else if (action === 'clear') {
            // On supprime toute la config
            removeNestedKey(permissionsData, key);
            writePermissions(permissionsData);
            await interaction.reply({
              content: `✅ La configuration pour \`${key}\` a été réinitialisée.`,
              ephemeral: true
            });
          }
          // On nettoie la session
          delete sessionCache[interaction.user.id];
        }
        else {
          // Sinon, on propose un menu pour choisir le rôle
          // Malheureusement, Discord n’a pas (encore) de "RoleSelectMenu" stable dans l'API
          // => On peut faire un StringSelectMenu avec la liste des rôles.
          const guildRoles = interaction.guild.roles.cache.filter(r => r.name !== '@everyone');
          const options = guildRoles.map(r => ({
            label: r.name,
            value: r.id
          })).slice(0, 25); // max 25

          const rowRole = new ActionRowBuilder()
            .addComponents(
              new StringSelectMenuBuilder()
                .setCustomId('managecommands_selectRole')
                .setPlaceholder('Sélectionnez un rôle...')
                .addOptions(options)
            );
          await interaction.reply({
            content: `Sélectionnez le rôle à ${action === 'add' ? 'ajouter' : 'retirer'} pour la clé \`${sessionCache[interaction.user.id].commandKey}\` :`,
            components: [rowRole],
            ephemeral: true
          });
        }
      }
      else if (interaction.customId === 'managecommands_selectRole') {
        // L'utilisateur a choisi un rôle
        const roleId = interaction.values[0];
        const key = sessionCache[interaction.user.id].commandKey;
        const action = sessionCache[interaction.user.id].action;
        const permissionsData = readPermissions();
        let data = getNestedKey(permissionsData, key);
        if (!data) {
          // On crée si inexistant
          setNestedKey(permissionsData, key, { roles: [] });
          data = getNestedKey(permissionsData, key);
        }
        if (!data.roles) data.roles = [];

        if (action === 'add') {
          if (data.roles.includes(roleId)) {
            await interaction.reply({
              content: `⚠️ Le rôle <@&${roleId}> est déjà configuré pour \`${key}\`.`,
              ephemeral: true
            });
          } else {
            data.roles.push(roleId);
            setNestedKey(permissionsData, key, data);
            writePermissions(permissionsData);
            await interaction.reply({
              content: `✅ Le rôle <@&${roleId}> a été ajouté pour \`${key}\`.`,
              ephemeral: true
            });
          }
        }
        else if (action === 'remove') {
          if (!data.roles.includes(roleId)) {
            await interaction.reply({
              content: `⚠️ Le rôle <@&${roleId}> n'est pas configuré pour \`${key}\`.`,
              ephemeral: true
            });
          } else {
            data.roles = data.roles.filter(r => r !== roleId);
            setNestedKey(permissionsData, key, data);
            writePermissions(permissionsData);
            await interaction.reply({
              content: `✅ Le rôle <@&${roleId}> a été retiré pour \`${key}\`.`,
              ephemeral: true
            });
          }
        }
        // On nettoie la session
        delete sessionCache[interaction.user.id];
      }
    }
  }
};

// Fonctions utilitaires pour accéder aux clés hiérarchiques, ex: "admin-moderation-manage"
function getNestedKey(obj, keyString) {
  const keys = keyString.split('-');
  let data = obj;
  for (const k of keys) {
    if (!data[k]) return null;
    data = data[k];
  }
  return data;
}
function setNestedKey(obj, keyString, value) {
  const keys = keyString.split('-');
  let data = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!data[keys[i]]) data[keys[i]] = {};
    data = data[keys[i]];
  }
  data[keys[keys.length - 1]] = value;
}
function removeNestedKey(obj, keyString) {
  const keys = keyString.split('-');
  let data = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!data[keys[i]]) return; // pas de clé
    data = data[keys[i]];
  }
  delete data[keys[keys.length - 1]];
}
