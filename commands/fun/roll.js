const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Lance un dé (1-6).'),
  async execute(interaction) {
    const result = Math.floor(Math.random() * 6) + 1;
    await interaction.reply({ content: `🎲 Tu as roulé un ${result} !`, ephemeral: true });
  },
};
