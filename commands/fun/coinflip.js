const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Pile ou face.'),
  async execute(interaction) {
    const result = Math.random() < 0.5 ? 'Pile' : 'Face';
    await interaction.reply({ content: `🪙 Le résultat est : ${result}`, ephemeral: true });
  },
};
