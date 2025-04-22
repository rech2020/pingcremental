const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, InteractionContextType } = require('discord.js');
const database = require('./../helpers/database.js');
const { buttons } = require('./feedback.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('numbers and stuff')
        .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel),
    async execute(interaction) {
        const response = await getMessage(interaction);
        await interaction.reply(response);
    },
    buttons: {
        refresh: (async interaction => {
            await interaction.update(await getMessage(interaction));
        })
    },
}

async function getMessage(interaction) {
    const player = await database.Player.findByPk(interaction.user.id);
    return {
        content: `
__**global**__
${await database.Player.count()} people have pinged at least once
${await database.Player.sum('totalScore')} total pts have been gained
${await database.Player.sum('score')} pts are currently owned
${await database.Player.sum('clicks')} pings have been dealt with
${await database.Player.sum('bluePings')} blue pings have found
${await database.Player.sum('bluePingsMissed')} blue pings have been missed
${await database.Player.sum('luckyPings')} lucky pings have been found

__**personal**__
${player.clicks} total ping${player.clicks == 1 ? '' : 's'}
${player.totalScore} total pts
${player.bluePings} blue ping${player.bluePings == 1 ? '' : 's'}
${player.bluePingsMissed} missed blue ping${player.bluePingsMissed == 1 ? '' : 's'} (${Math.round(player.bluePingsMissed / (player.bluePings + player.bluePingsMissed) * 100)}%)
${player.luckyPings} lucky ping${player.luckyPings == 1 ? '' : 's'}
`, components: [
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('stats:refresh')
                        .setLabel('refresh')
                        .setStyle(ButtonStyle.Secondary)
                )
        ]
    };
}