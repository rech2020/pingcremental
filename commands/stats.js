const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, InteractionContextType, MessageFlags } = require('discord.js');
const database = require('./../helpers/database.js');
const formatNumber = require('./../helpers/formatNumber.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('numbers and stuff')
        .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('the user to get stats for')
                .setRequired(false)   
        ),
    async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;
        const response = await getMessage(user.id);
        await interaction.reply(response);
    },
    buttons: {
        refresh: (async (interaction, userId) => {
            await interaction.update(await getMessage(userId || interaction.user.id));
        })
    },
}

async function getMessage(userId) {
    const player = await database.Player.findByPk(userId);
    if (!player) return { content: `<@${userId}> hasn't pinged yet.`, allowedMentions: { parse: [] }, flags: MessageFlags.Ephemeral };
    
    return {
        content: `
__**global**__
${formatNumber(await database.Player.count())} people have pinged at least once
${formatNumber(await database.Player.sum('totalScore'))} total pts have been gained
${formatNumber(await database.Player.sum('score'))} pts are currently owned
${formatNumber(await database.Player.sum('clicks'))} pings have been dealt with
${formatNumber(await database.Player.sum('bluePings'))} blue pings have been clicked
${formatNumber(await database.Player.sum('bluePingsMissed'))} blue pings have been missed
${formatNumber(await database.Player.sum('luckyPings'))} lucky pings have been found

**<@${userId}>__'s personal__**
${formatNumber(player.clicks)} total ping${player.clicks == 1 ? '' : 's'}
${formatNumber(player.totalScore)} total pts
${formatNumber(player.bluePings)} blue ping${player.bluePings == 1 ? '' : 's'} clicked
${formatNumber(player.bluePingsMissed)} missed blue ping${player.bluePingsMissed == 1 ? '' : 's'} (${Math.round(player.bluePingsMissed / (player.bluePings + player.bluePingsMissed) * 100)}% miss rate)
${formatNumber(player.luckyPings)} lucky ping${player.luckyPings == 1 ? '' : 's'}
${formatNumber(player.highestBlueStreak)} highest blue ping streak
`, components: [
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`stats:refresh-${userId}`)
                        .setLabel('refresh')
                        .setStyle(ButtonStyle.Secondary)
                )
        ],
        allowedMentions: { parse: [] }, // don't ping the user when refreshing
    };
}