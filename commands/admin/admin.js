const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Fichier de commandes désactivées
const disabledFile = path.join(__dirname, '../../disabled_commands.json');
// Fichier de configuration des rôles
const permissionsFile = path.join(__dirname, '../../command_permissions.json');

function readDisabledCommands() {
  if (!fs.existsSync(disabledFile)) return [];
  return JSON.parse(fs.readFileSync(disabledFile, 'utf8'));
}
function writeDisabledCommands(data) {
  fs.writeFileSync(disabledFile, JSON.stringify(data, null, 2));
}

function readPermissions() {
  if (!fs.existsSync(permissionsFile)) return {};
  return JSON.parse(fs.readFileSync(permissionsFile, 'utf8'));
}

/**
 * Exemple : si on veut une logique fine pour "channel"
 * (0 rôles => bloqué, user n’a pas le rôle => bloqué).
 */
function checkChannelPermissions(interaction, action) {
  const data = readPermissions();
  // On cherche data.admin.channel[action].roles
  const channelConfig = data.admin?.channel || {};
  const actionConfig = channelConfig[action] || {};
  const roles = actionConfig.roles || [];

  // 0 rôles => personne
  if (roles.length === 0) {
    return "Aucune permission données pour cette commande (channel)";
  }
  const memberRoles = interaction.member.roles.cache.map(r => r.id);
  const hasRole = roles.some(rid => memberRoles.includes(rid));
  if (!hasRole) {
    return "Vous n'avez pas le droit d'utiliser cette commande (channel)";
  }
  return null;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Commandes administratives regroupées.')
    .addSubcommand(sub =>
      sub
        .setName('moderation')
        .setDescription('Commandes de modération.')
        .addStringOption(opt =>
          opt.setName('action')
            .setDescription('Action: ban, kick, mute')
            .setRequired(true)
            .addChoices(
              { name: 'ban', value: 'ban' },
              { name: 'kick', value: 'kick' },
              { name: 'mute', value: 'mute' }
            )
        )
        .addUserOption(opt =>
          opt.setName('user')
            .setDescription('Utilisateur à cibler.')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('reason')
            .setDescription('Raison (optionnel)')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('channel')
        .setDescription('Commandes de gestion des salons.')
        .addStringOption(opt =>
          opt.setName('action')
            .setDescription('Action sur le salon.')
            .setRequired(true)
            .addChoices(
              { name: 'clear', value: 'clear' },
              { name: 'lock', value: 'lock' },
              { name: 'unlock', value: 'unlock' },
              { name: 'nuke', value: 'nuke' },
              { name: 'rename', value: 'rename' },
              { name: 'delete', value: 'delete' },
              { name: 'add', value: 'add' }
            )
        )
        .addIntegerOption(opt =>
          opt.setName('number')
            .setDescription('Nombre de messages à supprimer (clear).')
            .setRequired(false)
        )
        .addChannelOption(opt =>
          opt.setName('channel')
            .setDescription('Salon concerné (optionnel).')
            .setRequired(false)
        )
        .addStringOption(opt =>
          opt.setName('name')
            .setDescription('Nouveau nom du salon (rename/add).')
            .setRequired(false)
        )
        .addStringOption(opt =>
          opt.setName('type')
            .setDescription('Type de salon (add : text ou voice).')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('command')
        .setDescription('Gère l’activation/désactivation des commandes.')
        .addStringOption(opt =>
          opt.setName('action')
            .setDescription('Action sur la commande.')
            .setRequired(true)
            .addChoices(
              { name: 'disable', value: 'disable' },
              { name: 'enable', value: 'enable' },
              { name: 'list', value: 'list' }
            )
        )
        .addStringOption(opt =>
          opt.setName('commande')
            .setDescription('Nom de la commande (disable/enable).')
            .setRequired(false)
        )
    )
    // On retire les permissions natives => tout géré via JSON
    .setDefaultMemberPermissions(0),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const action = interaction.options.getString('action')?.toLowerCase();

    // On lit le disabled_commands.json
    const disabledCommands = readDisabledCommands();

    // Sous-commande "moderation"
    if (sub === 'moderation') {
      const user = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason') || 'Aucune raison spécifiée.';
      const member = interaction.guild.members.cache.get(user.id);
      if (!member) {
        return interaction.reply({ content: '❌ Utilisateur introuvable.', flags: 64 });
      }

      if (action === 'ban') {
        try {
          await member.ban({ reason });
          return interaction.reply({ content: `✅ ${user.tag} a été banni.`, flags: 64 });
        } catch (error) {
          console.error(error);
          return interaction.reply({ content: '❌ Impossible de bannir cet utilisateur.', flags: 64 });
        }
      }
      else if (action === 'kick') {
        try {
          await member.kick(reason);
          return interaction.reply({ content: `✅ ${user.tag} a été expulsé.`, flags: 64 });
        } catch (error) {
          console.error(error);
          return interaction.reply({ content: '❌ Impossible d’expulser cet utilisateur.', flags: 64 });
        }
      }
      else if (action === 'mute') {
        try {
          await member.timeout(10 * 60 * 1000, 'Mute via /admin');
          return interaction.reply({ content: `✅ ${user.tag} a été muté pour 10 minutes.`, flags: 64 });
        } catch (error) {
          console.error(error);
          return interaction.reply({ content: '❌ Impossible de mute cet utilisateur.', flags: 64 });
        }
      }
    }
    // Sous-commande "channel"
    else if (sub === 'channel') {
      // Ex: check plus fin : exiger que admin.channel[action].roles ne soit pas vide
      const permError = checkChannelPermissions(interaction, action);
      if (permError) {
        return interaction.reply({ content: permError, flags: 64 });
      }

      const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
      if (action === 'clear') {
        const number = interaction.options.getInteger('number');
        if (!number || number < 1 || number > 100) {
          return interaction.reply({
            content: '❌ Le nombre doit être entre 1 et 100.',
            flags: 64
          });
        }
        try {
          let messages = await targetChannel.messages.fetch({ limit: number });
          messages = messages.filter(msg => (Date.now() - msg.createdTimestamp) < 14 * 24 * 60 * 60 * 1000);
          if (messages.size === 0) {
            return interaction.reply({ content: '❌ Aucun message récent à supprimer.', flags: 64 });
          }
          const deleted = await targetChannel.bulkDelete(messages, true);
          return interaction.reply({ content: `✅ ${deleted.size} messages supprimés.`, flags: 64 });
        } catch (error) {
          console.error(error);
          return interaction.reply({ content: '❌ Erreur lors de la suppression des messages.', flags: 64 });
        }
      }
      else if (action === 'lock') {
        try {
          await targetChannel.permissionOverwrites.edit(
            interaction.guild.roles.everyone,
            { SendMessages: false }
          );
          await targetChannel.send("🔒 Salon verrouillé.");
          return interaction.reply({ content: `✅ Salon ${targetChannel} verrouillé.`, flags: 64 });
        } catch (error) {
          console.error(error);
          return interaction.reply({ content: '❌ Erreur lors du verrouillage.', flags: 64 });
        }
      }
      else if (action === 'unlock') {
        try {
          await targetChannel.permissionOverwrites.edit(
            interaction.guild.roles.everyone,
            { SendMessages: true }
          );
          await targetChannel.send("🔓 Salon déverrouillé.");
          return interaction.reply({ content: `✅ Salon ${targetChannel} déverrouillé.`, flags: 64 });
        } catch (error) {
          console.error(error);
          return interaction.reply({ content: '❌ Erreur lors du déverrouillage.', flags: 64 });
        }
      }
      else if (action === 'nuke') {
        try {
          const clone = await targetChannel.clone({ reason: 'Nuke via /admin' });
          await interaction.reply({ content: `✅ Salon cloné : ${clone}`, flags: 64 });
          setTimeout(async () => {
            await targetChannel.delete('Nuke via /admin');
            await clone.send("Ce salon a été nuké.");
          }, 2000);
        } catch (error) {
          console.error(error);
          return interaction.reply({ content: '❌ Erreur lors du nuke.', flags: 64 });
        }
      }
      else if (action === 'rename') {
        const newName = interaction.options.getString('name');
        if (!newName) {
          return interaction.reply({ content: '❌ Veuillez fournir un nouveau nom.', flags: 64 });
        }
        try {
          await targetChannel.setName(newName, 'Renommage via /admin');
          return interaction.reply({ content: `✅ Salon renommé en ${newName}.`, flags: 64 });
        } catch (error) {
          console.error(error);
          return interaction.reply({ content: '❌ Erreur lors du renommage.', flags: 64 });
        }
      }
      else if (action === 'delete') {
        try {
          await targetChannel.delete('Suppression via /admin');
          return; // plus de réponse possible
        } catch (error) {
          console.error(error);
          return interaction.reply({ content: '❌ Erreur lors de la suppression.', flags: 64 });
        }
      }
      else if (action === 'add') {
        const name = interaction.options.getString('name');
        const typeStr = interaction.options.getString('type') || 'text';
        const type = typeStr.toLowerCase() === 'voice' ? 2 : 0;
        if (!name) {
          return interaction.reply({ content: '❌ Veuillez fournir un nom.', flags: 64 });
        }
        try {
          const newChannel = await interaction.guild.channels.create({
            name,
            type,
            reason: 'Création via /admin'
          });
          return interaction.reply({ content: `✅ Salon créé : ${newChannel}`, flags: 64 });
        } catch (error) {
          console.error(error);
          return interaction.reply({ content: '❌ Erreur lors de la création.', flags: 64 });
        }
      }
    }
    // Sous-commande "command"
    else if (sub === 'command') {
      const action = interaction.options.getString('action');
      const cmdName = interaction.options.getString('commande')?.toLowerCase();
      if (!cmdName && (action === 'disable' || action === 'enable')) {
        return interaction.reply({ 
          content: '❌ Veuillez spécifier la commande à désactiver ou activer.',
          flags: 64
        });
      }
      if (action === 'disable') {
        if (!disabledCommands.includes(cmdName)) {
          disabledCommands.push(cmdName);
          writeDisabledCommands(disabledCommands);
          return interaction.reply({ content: `✅ La commande \`${cmdName}\` a été désactivée.`, flags: 64 });
        } else {
          return interaction.reply({ content: `⚠️ La commande \`${cmdName}\` est déjà désactivée.`, flags: 64 });
        }
      }
      else if (action === 'enable') {
        if (disabledCommands.includes(cmdName)) {
          const updated = disabledCommands.filter(c => c !== cmdName);
          writeDisabledCommands(updated);
          return interaction.reply({ content: `✅ La commande \`${cmdName}\` a été réactivée.`, flags: 64 });
        } else {
          return interaction.reply({ content: `⚠️ La commande \`${cmdName}\` n'était pas désactivée.`, flags: 64 });
        }
      }
      else if (action === 'list') {
        if (disabledCommands.length === 0) {
          return interaction.reply({ content: "✅ Aucune commande désactivée.", flags: 64 });
        } else {
          const listStr = disabledCommands.map(cmd => `\`${cmd}\``).join(', ');
          return interaction.reply({ content: `📋 Commandes désactivées: ${listStr}`, flags: 64 });
        }
      }
    }
  },
};
