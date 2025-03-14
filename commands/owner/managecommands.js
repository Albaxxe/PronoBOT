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

module.exports = {
  data: new SlashCommandBuilder()
    .setName('managecommands')
    .setDescription('Gère les accès aux commandes (configuration propriétaire).')
    .addStringOption(option =>
      option.setName('action')
        .setDescription('Action à effectuer (list, add, remove, clear)')
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
        .setDescription('Clé de la commande (ex: admin-moderation-manage)')
        .setRequired(true)
    )
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('Rôle à ajouter ou retirer (non requis pour clear)')
        .setRequired(false)
    ),
  async execute(interaction) {
    if (interaction.user.id !== config.ownerId) {
      return interaction.reply({ content: '❌ Seul le propriétaire peut utiliser cette commande.', flags: MessageFlags.Ephemeral });
    }
    const action = interaction.options.getString('action');
    const commandKey = interaction.options.getString('commandkey').toLowerCase();
    const role = interaction.options.getRole('role');

    let permissionsData = readPermissions();

    // Pour une clé hiérarchique, on s'attend à un objet
    if (!permissionsData[commandKey]) {
      // Si la clé n'existe pas, on la crée
      permissionsData[commandKey] = { roles: [] };
    }

    if (action === 'list') {
      const roles = permissionsData[commandKey].roles;
      if (roles.length === 0) {
        return interaction.reply({ content: `Aucun rôle configuré pour \`${commandKey}\`.`, flags: MessageFlags.Ephemeral });
      }
      return interaction.reply({ content: `Rôles pour \`${commandKey}\`: ${roles.map(r => `<@&${r}>`).join(', ')}`, flags: MessageFlags.Ephemeral });
    }
    else if (action === 'add') {
      if (!role) {
        return interaction.reply({ content: '❌ Veuillez spécifier un rôle à ajouter.', flags: MessageFlags.Ephemeral });
      }
      if (permissionsData[commandKey].roles.includes(role.id)) {
        return interaction.reply({ content: `⚠️ Le rôle <@&${role.id}> est déjà configuré pour \`${commandKey}\`.`, flags: MessageFlags.Ephemeral });
      }
      permissionsData[commandKey].roles.push(role.id);
      writePermissions(permissionsData);
      return interaction.reply({ content: `✅ Le rôle <@&${role.id}> a été ajouté pour \`${commandKey}\`.`, flags: MessageFlags.Ephemeral });
    }
    else if (action === 'remove') {
      if (!role) {
        return interaction.reply({ content: '❌ Veuillez spécifier un rôle à retirer.', flags: MessageFlags.Ephemeral });
      }
      if (!permissionsData[commandKey].roles.includes(role.id)) {
        return interaction.reply({ content: `⚠️ Le rôle <@&${role.id}> n'est pas configuré pour \`${commandKey}\`.`, flags: MessageFlags.Ephemeral });
      }
      permissionsData[commandKey].roles = permissionsData[commandKey].roles.filter(rid => rid !== role.id);
      writePermissions(permissionsData);
      return interaction.reply({ content: `✅ Le rôle <@&${role.id}> a été retiré pour \`${commandKey}\`.`, flags: MessageFlags.Ephemeral });
    }
    else if (action === 'clear') {
      delete permissionsData[commandKey];
      writePermissions(permissionsData);
      return interaction.reply({ content: `✅ La configuration pour \`${commandKey}\` a été réinitialisée.`, flags: MessageFlags.Ephemeral });
    }
    else {
      return interaction.reply({ content: '❌ Action invalide.', flags: MessageFlags.Ephemeral });
    }
  }
};
