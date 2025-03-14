const { 
    SlashCommandBuilder, 
    PermissionFlagsBits 
  } = require('discord.js');
  const fs = require('fs');
  const path = require('path');
  
  // Fichier de commandes désactivées
  const disabledFile = path.join(__dirname, '../../disabled_commands.json');
  function readDisabledCommands() {
    if (!fs.existsSync(disabledFile)) return [];
    return JSON.parse(fs.readFileSync(disabledFile, 'utf8'));
  }
  function writeDisabledCommands(data) {
    fs.writeFileSync(disabledFile, JSON.stringify(data, null, 2));
  }
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName('admin')
      .setDescription('Commandes administratives regroupées.')
      
      // Groupe "moderation"
      .addSubcommandGroup(group =>
        group
          .setName('moderation')
          .setDescription('Commandes de modération.')
          .addSubcommand(sub =>
            sub
              .setName('ban')
              .setDescription('Bannir un utilisateur du serveur.')
              .addUserOption(opt =>
                opt.setName('user')
                  .setDescription('Utilisateur à bannir')
                  .setRequired(true)
              )
              .addStringOption(opt =>
                opt.setName('reason')
                  .setDescription('Raison (optionnel)')
              )
          )
          .addSubcommand(sub =>
            sub
              .setName('kick')
              .setDescription('Expulser un utilisateur du serveur.')
              .addUserOption(opt =>
                opt.setName('user')
                  .setDescription('Utilisateur à expulser')
                  .setRequired(true)
              )
              .addStringOption(opt =>
                opt.setName('reason')
                  .setDescription('Raison (optionnel)')
              )
          )
          .addSubcommand(sub =>
            sub
              .setName('mute')
              .setDescription('Mute un utilisateur pendant 10 minutes.')
              .addUserOption(opt =>
                opt.setName('user')
                  .setDescription('Utilisateur à muter')
                  .setRequired(true)
              )
          )
      )
  
      // Groupe "channel"
      .addSubcommandGroup(group =>
        group
          .setName('channel')
          .setDescription('Gestion des salons.')
          .addSubcommand(sub =>
            sub
              .setName('clear')
              .setDescription('Supprime un certain nombre de messages récents (<14j, max 100).')
              .addIntegerOption(opt =>
                opt.setName('number')
                  .setDescription('Nombre de messages (1-100)')
                  .setRequired(true)
              )
          )
          .addSubcommand(sub =>
            sub
              .setName('lock')
              .setDescription('Verrouille un salon (empêche SendMessages).')
              .addChannelOption(opt =>
                opt.setName('channel')
                  .setDescription('Salon à verrouiller (optionnel)')
                  .setRequired(false)
              )
          )
          .addSubcommand(sub =>
            sub
              .setName('unlock')
              .setDescription('Déverrouille un salon (autorise SendMessages).')
              .addChannelOption(opt =>
                opt.setName('channel')
                  .setDescription('Salon à déverrouiller (optionnel)')
                  .setRequired(false)
              )
          )
          .addSubcommand(sub =>
            sub
              .setName('nuke')
              .setDescription('Clone puis supprime un salon pour le nettoyer complètement.')
              .addChannelOption(opt =>
                opt.setName('channel')
                  .setDescription('Salon à nuker (optionnel, sinon le salon actuel)')
                  .setRequired(false)
              )
          )
          .addSubcommand(sub =>
            sub
              .setName('rename')
              .setDescription('Renomme un salon.')
              .addStringOption(opt =>
                opt.setName('name')
                  .setDescription('Nouveau nom du salon')
                  .setRequired(true)
              )
              .addChannelOption(opt =>
                opt.setName('channel')
                  .setDescription('Salon à renommer (optionnel, sinon le salon actuel)')
                  .setRequired(false)
              )
          )
          .addSubcommand(sub =>
            sub
              .setName('delete')
              .setDescription('Supprime un salon.')
              .addChannelOption(opt =>
                opt.setName('channel')
                  .setDescription('Salon à supprimer (optionnel, sinon le salon actuel)')
                  .setRequired(false)
              )
          )
          .addSubcommand(sub =>
            sub
              .setName('add')
              .setDescription('Crée un nouveau salon.')
              .addStringOption(opt =>
                opt.setName('name')
                  .setDescription('Nom du nouveau salon')
                  .setRequired(true)
              )
              .addStringOption(opt =>
                opt.setName('type')
                  .setDescription('Type de salon (text ou voice)')
                  .setRequired(false)
              )
          )
      )
  
      // Groupe "command" (gestion des commandes)
      .addSubcommandGroup(group =>
        group
          .setName('command')
          .setDescription('Gère l’activation/désactivation des commandes.')
          .addSubcommand(sub =>
            sub
              .setName('disable')
              .setDescription('Désactive une commande.')
              .addStringOption(opt =>
                opt.setName('commande')
                  .setDescription('Nom de la commande à désactiver')
                  .setAutocomplete(true)
                  .setRequired(true)
              )
          )
          .addSubcommand(sub =>
            sub
              .setName('enable')
              .setDescription('Réactive une commande.')
              .addStringOption(opt =>
                opt.setName('commande')
                  .setDescription('Nom de la commande à activer')
                  .setAutocomplete(true)
                  .setRequired(true)
              )
          )
          .addSubcommand(sub =>
            sub
              .setName('list')
              .setDescription('Liste les commandes désactivées.')
          )
      )
      // Permissions par défaut pour /admin (staff)
      .setDefaultMemberPermissions(
        PermissionFlagsBits.ManageChannels | 
        PermissionFlagsBits.BanMembers | 
        PermissionFlagsBits.KickMembers | 
        PermissionFlagsBits.ModerateMembers
      ),
  
    async execute(interaction) {
      // Construction de la clé d'identification pour la vérification des permissions
      const baseCommand = interaction.commandName.toLowerCase(); // "admin"
      let fullKey = baseCommand;
      const subGroup = interaction.options.getSubcommandGroup(false);
      const sub = interaction.options.getSubcommand(false);
      if (subGroup) fullKey += `-${subGroup}`;
      if (sub) fullKey += `-${sub}`;
  
      // Si le groupe est "command", gérer la désactivation/activation
      if (baseCommand === 'admin' && subGroup === 'command') {
        const disabledCommands = readDisabledCommands();
        if (sub === 'disable') {
          const cmdToDisable = interaction.options.getString('commande').toLowerCase();
          if (!disabledCommands.includes(cmdToDisable)) {
            disabledCommands.push(cmdToDisable);
            writeDisabledCommands(disabledCommands);
            return interaction.reply({ content: `✅ La commande \`${cmdToDisable}\` a été désactivée.`, ephemeral: true });
          } else {
            return interaction.reply({ content: `⚠️ La commande \`${cmdToDisable}\` est déjà désactivée.`, ephemeral: true });
          }
        } else if (sub === 'enable') {
          const cmdToEnable = interaction.options.getString('commande').toLowerCase();
          if (disabledCommands.includes(cmdToEnable)) {
            const updated = disabledCommands.filter(cmd => cmd !== cmdToEnable);
            writeDisabledCommands(updated);
            return interaction.reply({ content: `✅ La commande \`${cmdToEnable}\` a été réactivée.`, ephemeral: true });
          } else {
            return interaction.reply({ content: `⚠️ La commande \`${cmdToEnable}\` n'était pas désactivée.`, ephemeral: true });
          }
        } else if (sub === 'list') {
          if (disabledCommands.length === 0) {
            return interaction.reply({ content: "✅ Aucune commande désactivée.", ephemeral: true });
          } else {
            const listStr = disabledCommands.map(cmd => `\`${cmd}\``).join(', ');
            return interaction.reply({ content: `📋 Commandes désactivées: ${listStr}`, ephemeral: true });
          }
        }
        return;
      }
  
      // Pour les autres sous-commandes, la vérification des permissions (via interactionCreate global) se fera
      // Ici, on se contente d'exécuter la logique propre à chaque sous-commande.
  
      // ----- Groupe "moderation" -----
      if (subGroup === 'moderation') {
        if (sub === 'ban') {
          const user = interaction.options.getUser('user');
          const reason = interaction.options.getString('reason') || 'Aucune raison spécifiée.';
          const member = interaction.guild.members.cache.get(user.id);
          if (!member) return interaction.reply({ content: '❌ Utilisateur introuvable.', ephemeral: true });
          try {
            await member.ban({ reason });
            return interaction.reply({ content: `✅ ${user.tag} a été banni.`, ephemeral: true });
          } catch (error) {
            console.error(error);
            return interaction.reply({ content: '❌ Impossible de bannir cet utilisateur.', ephemeral: true });
          }
        } else if (sub === 'kick') {
          const user = interaction.options.getUser('user');
          const reason = interaction.options.getString('reason') || 'Aucune raison spécifiée.';
          const member = interaction.guild.members.cache.get(user.id);
          if (!member) return interaction.reply({ content: '❌ Utilisateur introuvable.', ephemeral: true });
          try {
            await member.kick(reason);
            return interaction.reply({ content: `✅ ${user.tag} a été expulsé.`, ephemeral: true });
          } catch (error) {
            console.error(error);
            return interaction.reply({ content: '❌ Impossible d’expulser cet utilisateur.', ephemeral: true });
          }
        } else if (sub === 'mute') {
          const user = interaction.options.getUser('user');
          const member = interaction.guild.members.cache.get(user.id);
          if (!member) return interaction.reply({ content: '❌ Utilisateur introuvable.', ephemeral: true });
          try {
            await member.timeout(10 * 60 * 1000, 'Mute via /admin');
            return interaction.reply({ content: `✅ ${user.tag} a été muté pour 10 minutes.`, ephemeral: true });
          } catch (error) {
            console.error(error);
            return interaction.reply({ content: '❌ Impossible de mute cet utilisateur.', ephemeral: true });
          }
        }
      }
      // ----- Groupe "channel" -----
      else if (subGroup === 'channel') {
        if (sub === 'clear') {
          const number = interaction.options.getInteger('number');
          if (number < 1 || number > 100) return interaction.reply({ content: '❌ Le nombre doit être entre 1 et 100.', ephemeral: true });
          try {
            let messages = await interaction.channel.messages.fetch({ limit: number });
            messages = messages.filter(msg => (Date.now() - msg.createdTimestamp) < 14 * 24 * 60 * 60 * 1000);
            if (messages.size === 0) return interaction.reply({ content: '❌ Aucun message récent à supprimer.', ephemeral: true });
            const deleted = await interaction.channel.bulkDelete(messages, true);
            return interaction.reply({ content: `✅ ${deleted.size} messages supprimés.`, ephemeral: true });
          } catch (error) {
            console.error(error);
            return interaction.reply({ content: '❌ Erreur lors de la suppression des messages.', ephemeral: true });
          }
        } else if (sub === 'lock') {
          const channel = interaction.options.getChannel('channel') || interaction.channel;
          try {
            await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
            await channel.send("🔒 Salon verrouillé.");
            return interaction.reply({ content: `✅ Salon ${channel} verrouillé.`, ephemeral: true });
          } catch (error) {
            console.error(error);
            return interaction.reply({ content: '❌ Erreur lors du verrouillage.', ephemeral: true });
          }
        } else if (sub === 'unlock') {
          const channel = interaction.options.getChannel('channel') || interaction.channel;
          try {
            await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: true });
            await channel.send("🔓 Salon déverrouillé.");
            return interaction.reply({ content: `✅ Salon ${channel} déverrouillé.`, ephemeral: true });
          } catch (error) {
            console.error(error);
            return interaction.reply({ content: '❌ Erreur lors du déverrouillage.', ephemeral: true });
          }
        } else if (sub === 'nuke') {
          const channel = interaction.options.getChannel('channel') || interaction.channel;
          try {
            const clone = await channel.clone({ reason: 'Nuke via /admin' });
            await interaction.reply({ content: `✅ Salon ${channel} cloné. Nouveau salon : ${clone}`, ephemeral: true });
            setTimeout(async () => {
              await channel.delete('Nuke via /admin');
              await clone.send("Ce salon a été nuké.");
            }, 2000);
          } catch (error) {
            console.error(error);
            return interaction.reply({ content: '❌ Erreur lors du nuke du salon.', ephemeral: true });
          }
        } else if (sub === 'rename') {
          const newName = interaction.options.getString('name');
          const channel = interaction.options.getChannel('channel') || interaction.channel;
          try {
            await channel.setName(newName, 'Renommage via /admin');
            return interaction.reply({ content: `✅ Salon renommé en ${newName}.`, ephemeral: true });
          } catch (error) {
            console.error(error);
            return interaction.reply({ content: '❌ Erreur lors du renommage du salon.', ephemeral: true });
          }
        } else if (sub === 'delete') {
          const channel = interaction.options.getChannel('channel') || interaction.channel;
          try {
            await channel.delete('Suppression via /admin');
          } catch (error) {
            console.error(error);
            return interaction.reply({ content: '❌ Erreur lors de la suppression du salon.', ephemeral: true });
          }
        } else if (sub === 'add') {
          const name = interaction.options.getString('name');
          const typeStr = interaction.options.getString('type') || 'text';
          const type = typeStr.toLowerCase() === 'voice' ? 2 : 0; // 0 = text, 2 = voice
          try {
            const newChannel = await interaction.guild.channels.create({
              name,
              type,
              reason: 'Création via /admin'
            });
            return interaction.reply({ content: `✅ Salon ${newChannel} créé.`, ephemeral: true });
          } catch (error) {
            console.error(error);
            return interaction.reply({ content: '❌ Erreur lors de la création du salon.', ephemeral: true });
          }
        }
      }
    },
  };
  