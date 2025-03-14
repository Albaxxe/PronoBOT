const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../../config.json');

const permissionsFile = path.join(__dirname, '../../command_permissions.json');

function readPermissions() {
  if (!fs.existsSync(permissionsFile)) return {};
  return JSON.parse(fs.readFileSync(permissionsFile, 'utf8'));
}

function writePermissions(data) {
  fs.writeFileSync(permissionsFile, JSON.stringify(data, null, 2));
}

function getNestedProperty(obj, keys) {
  return keys.reduce((o, k) => (o || {})[k], obj);
}

function setNestedProperty(obj, keys, value) {
  let o = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!o[keys[i]]) o[keys[i]] = {};
    o = o[keys[i]];
  }
  o[keys[keys.length - 1]] = value;
  return obj;
}

function deleteNestedProperty(obj, keys) {
  let o = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!o[keys[i]]) return;
    o = o[keys[i]];
  }
  delete o[keys[keys.length - 1]];
}

/**
 * Récupère toutes les clés imbriquées pour proposer en autocomplétion.
 */
function getAllPermissionKeys(obj, prefix = '') {
  let results = [];
  for (const key in obj) {
    if (key === 'roles') continue;
    const val = obj[key];
    const newPrefix = prefix ? `${prefix}-${key}` : key;
    if (val && typeof val === 'object') {
      results.push(newPrefix);
      results = results.concat(getAllPermissionKeys(val, newPrefix));
    }
  }
  return results;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('managecommands')
    .setDescription('Gère les accès aux commandes (configuration propriétaire).')
    .addStringOption(option =>
      option.setName('action')
        .setDescription('Action (list, add, remove, clear)')
        .setRequired(true)
        .addChoices(
          { name: 'list', value: 'list' },
          { name: 'add', value: 'add' },
          { name: 'remove', value: 'remove' },
          { name: 'clear', value: 'clear' }
        )
    )
    .addStringOption(option =>
      option.setName('commandkey')
        .setDescription('Clé de la commande (ex: admin-moderation-ban)')
        .setRequired(false) // Désormais optionnel
        .setAutocomplete(true)
    )
    .addStringOption(option =>
      option.setName('roles')
        .setDescription('Mentionnez un ou plusieurs rôles (ex: @Role1 @Role2) (non requis pour list/clear)')
        .setRequired(false)
    ),

  async execute(interaction) {
    if (interaction.user.id !== config.ownerId) {
      return interaction.reply({
        content: '❌ Seul le propriétaire peut utiliser cette commande.',
        flags: MessageFlags.Ephemeral
      });
    }

    const action = interaction.options.getString('action');
    const commandKey = interaction.options.getString('commandkey') || null;
    const rolesString = interaction.options.getString('roles') || '';

    let permissionsData = readPermissions();

    // === ✅ Cas "list" : on affiche tout si aucun commandKey n'est précisé ===
    if (action === 'list') {
      if (!commandKey) {
        // Affichage de **toutes** les commandes et leurs rôles configurés
        const entries = Object.entries(permissionsData)
          .map(([key, value]) => {
            const roles = value.roles || [];
            return `\`${key}\`: ${roles.length > 0 ? roles.map(r => `<@&${r}>`).join(', ') : '🚫 Aucun rôle configuré'}`;
          });

        return interaction.reply({
          content: `📋 **Liste des commandes et leurs rôles:**\n\n${entries.join('\n')}`,
          flags: MessageFlags.Ephemeral
        });
      }

      // Cas où `commandKey` est précisé => on affiche seulement cette clé
      const keys = commandKey.split('-');
      let currentConfig = getNestedProperty(permissionsData, keys) || { roles: [] };
      const roles = currentConfig.roles || [];

      return interaction.reply({
        content: `📌 Rôles pour \`${commandKey}\`: ${roles.length > 0 ? roles.map(r => `<@&${r}>`).join(', ') : '🚫 Aucun rôle configuré'}`,
        flags: MessageFlags.Ephemeral
      });
    }

    // === ⛔ Cas où `commandKey` est nécessaire (add, remove, clear) ===
    if (!commandKey && (action === 'add' || action === 'remove' || action === 'clear')) {
      return interaction.reply({
        content: '❌ Veuillez spécifier un "commandkey" pour cette action.',
        flags: MessageFlags.Ephemeral
      });
    }

    const keys = commandKey ? commandKey.split('-') : [];
    let currentConfig = keys.length ? getNestedProperty(permissionsData, keys) : null;
    if (keys.length && !currentConfig) {
      currentConfig = { roles: [] };
      permissionsData = setNestedProperty(permissionsData, keys, currentConfig);
    }

    // === Cas "clear" ===
    if (action === 'clear') {
      deleteNestedProperty(permissionsData, keys);
      writePermissions(permissionsData);
      return interaction.reply({
        content: `✅ La configuration pour \`${commandKey}\` a été réinitialisée.`,
        flags: MessageFlags.Ephemeral
      });
    }

    // === Cas "add" & "remove" ===
    const pattern = /<@&(\d+)>/g;
    const matches = [...rolesString.matchAll(pattern)];
    if (matches.length === 0) {
      return interaction.reply({
        content: '❌ Veuillez mentionner au moins un rôle (ex: @Role1 @Role2).',
        flags: MessageFlags.Ephemeral
      });
    }
    const roleIds = matches.map(m => m[1]);
    const roles = currentConfig.roles || [];
    let changedCount = 0;

    if (action === 'add') {
      for (const rid of roleIds) {
        if (!roles.includes(rid)) {
          roles.push(rid);
          changedCount++;
        }
      }
      currentConfig.roles = roles;
      permissionsData = setNestedProperty(permissionsData, keys, currentConfig);
      writePermissions(permissionsData);
      return interaction.reply({
        content: `✅ ${changedCount} rôle(s) ajouté(s) pour \`${commandKey}\`.`,
        flags: MessageFlags.Ephemeral
      });
    } else {
      // action === 'remove'
      const beforeCount = roles.length;
      currentConfig.roles = roles.filter(rid => !roleIds.includes(rid));
      changedCount = beforeCount - currentConfig.roles.length;
      permissionsData = setNestedProperty(permissionsData, keys, currentConfig);
      writePermissions(permissionsData);
      return interaction.reply({
        content: `✅ ${changedCount} rôle(s) retiré(s) pour \`${commandKey}\`.`,
        flags: MessageFlags.Ephemeral
      });
    }
  },

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused(true);
    if (focused.name !== 'commandkey') return;

    const permissionsData = readPermissions();
    const allKeys = getAllPermissionKeys(permissionsData);
    const typed = focused.value.toLowerCase();
    const filtered = allKeys.filter(k => k.toLowerCase().includes(typed)).slice(0, 25);
    const suggestions = filtered.map(k => ({ name: k, value: k }));
    await interaction.respond(suggestions);
  }
};
