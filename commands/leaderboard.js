const { SlashCommandBuilder, EmbedBuilder, InteractionContextType, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const database = require('./../helpers/database.js')
const sequelize = require('sequelize')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('check who\'s best')
        .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel),
    async execute(interaction) {
        await interaction.reply({ embeds: [ new EmbedBuilder().setDescription('one sec...') ] });
        await interaction.editReply(await getMessage(interaction)); // add (edited) so it doesn't move after refresh
    },
    buttons: {
        refresh: (async interaction => {
            await interaction.update(await getMessage(interaction));
        })
    }
}

async function getMessage(interaction) {
    let description = "*leaderboard updates every minute*\n";
    const lbPlayers = await database.LeaderboardPlayer.findAll({
        order: [
            ['position', 'ASC'],
        ]
    });

    const leaderboardEmojis = [
        "🥇",
        "🥈",
        "🥉",
        "🎗",
    ]
    
    for (player of lbPlayers) {
        const puser = await interaction.client.users.fetch(player.userId)
        description += 
`
${leaderboardEmojis[Math.min(leaderboardEmojis.length, player.position)-1]}**${puser.username.replaceAll("_","\\_")}** - \`${player.score} pts\` total`
    }

    const embed = new EmbedBuilder()
        .setTitle("leaderboard")
        .setColor('#9c8e51')
        .setDescription(description)
    const button = new ButtonBuilder()
        .setCustomId('leaderboard:refresh')
        .setLabel('refresh')
        .setStyle(ButtonStyle.Secondary)
    const row = new ActionRowBuilder()
        .addComponents(button)
    return {
        contents: "",
        embeds: [embed],
        components: [row]
    }
}