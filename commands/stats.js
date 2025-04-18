const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, InteractionContextType } = require('discord.js');
const database = require('./../helpers/database.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('numbers and stuff')
        .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel),
    async execute(interaction) {
        const response = `
__**global**__
${await database.Player.count()} people have pinged at least once
${await database.Player.sum('totalScore')} total pts have been gained
${await database.Player.sum('score')} pts are currently owned
${await database.Player.sum('clicks')} pings have been dealt with
__**personal**__
${(await database.Player.findByPk(interaction.user.id)).clicks} total pings
${(await database.Player.findByPk(interaction.user.id)).totalScore} total pts
`;
        await interaction.reply(`${response}`);
    }
}