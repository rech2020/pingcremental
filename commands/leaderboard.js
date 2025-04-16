const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, InteractionContextType } = require('discord.js');
const database = require('./../helpers/database.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('check who\'s best')
        .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel),
    async execute(interaction) {
        let description = "*leaderboard updates every minute*\n";
        const lbPlayers = await database.LeaderboardPlayer.findAll({
            order: [
                sequelize.fn(sequelize.col('position'), "DESC")
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
${leaderboardEmojis[Math.max(leaderboardEmojis.length, player.position)]}**${puser.username}** - \`${score} pts\` total`
        }

        const embed = new EmbedBuilder()
            .setTitle("leaderboard")
            .setColor('#9c8e51')
            .setDescription(description)
        await interaction.reply({ embeds: [embed] })
    }
}