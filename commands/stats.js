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
    return {
        content: `
__**global**__
${await database.Player.count()} people have pinged at least once
${await database.Player.sum('totalScore')} total pts have been gained
${await database.Player.sum('score')} pts are currently owned
${await database.Player.sum('clicks')} pings have been dealt with
__**personal**__
${(await database.Player.findByPk(interaction.user.id)).clicks} total pings
${(await database.Player.findByPk(interaction.user.id)).totalScore} total pts
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