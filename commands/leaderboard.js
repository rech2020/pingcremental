const { SlashCommandBuilder, EmbedBuilder, InteractionContextType, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const database = require('./../helpers/database.js')
const formatNumber = require('./../helpers/formatNumber.js');
const { getEmoji } = require('../helpers/emojis.js');

const leaderboardTypes = {
    totalScore: {
        name: 'total pts',
        emoji: '✨',
        metric: "pts total"
    },
    totalClicks: {
        name: 'total clicks',
        emoji: '🖱️',
        metric: "clicks"
    },
    score: {
        name: 'pts',
        emoji: '💰',
        metric: "pts currently owned"
    },
    bluePings: {
        name: 'blue pings',
        emoji: '🔵',
        metric: "blue pings clicked"
    },
    bluePingsMissed: {
        name: 'blue pings missed',
        emoji: '❌',
        metric: "blue pings missed"
    },
    luckyPings: {
        name: 'lucky pings',
        emoji: '🍀',
        metric: "rare pings discovered"
    },
    highestBlueStreak: {
        name: 'highest blue streak',
        emoji: '🔵',
        metric: "blue pings in a row"
    },
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('check who\'s best')
        .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel),
    async execute(interaction) {
        await interaction.reply({ embeds: [new EmbedBuilder().setDescription('one sec...')] });
        await interaction.editReply(await getMessage(interaction, 'totalScore')); // add (edited) so it doesn't move after refresh
    },
    buttons: {
        refresh: (async (interaction, leaderboard) => {
            await interaction.update(await getMessage(interaction, leaderboard));
        })
    },
    dropdowns: {
        select: (async (interaction) => {
            const leaderboardType = interaction.values[0];
            await interaction.update(await getMessage(interaction, leaderboardType));
        })
    }
}

async function getMessage(interaction, leaderboardType) {
    let description = "";
    const topPlayers = await database.Player.findAll({
        order: [[leaderboardType, 'DESC']], // highest first
        attributes: ['userId', leaderboardType], // only get userId and totalScore
        limit: 10, // top 10 only
    })

    let leaderboardEmojis = []
    for (let i = 0; i < 10; i++) {
        leaderboardEmojis.push(getEmoji(`rank_${i + 1}`)); // get the emoji for the position
    }
    leaderboardEmojis.push('✨');

    for (player of topPlayers) {
        const puser = await interaction.client.users.fetch(player.userId) // find the user for username display

        description +=
            `
${leaderboardEmojis[Math.min(leaderboardEmojis.length, player.position) - 1]} ${formatPlayer(puser.username, player[leaderboardType], leaderboardType, interaction)}`
    }

    // if the user is not in the leaderboard, add them to the end of the list
    if (lbPlayers.find(player => player.userId == interaction.user.id) == null) {
        description += `\n...\n**##** ${formatPlayer(interaction.user.username, interaction.user[leaderboardType], leaderboardType, interaction)}`
    }

    const embed = new EmbedBuilder()
        .setTitle(`leaderboard / ${leaderboardTypes[leaderboardType].emoji} ${leaderboardTypes[leaderboardType].name}`)
        .setColor('#9c8e51')
        .setDescription(description)
    const button = new ButtonBuilder()
        .setCustomId(`leaderboard:refresh-${leaderboardType}`)
        .setLabel('refresh')
        .setStyle(ButtonStyle.Secondary)
    const row = new ActionRowBuilder()
        .addComponents(button)

    const select = new StringSelectMenuBuilder()
        .setCustomId(`leaderboard:select`)
        .setPlaceholder(`select leaderboard type`)
    for (const [key, value] of Object.entries(leaderboardTypes)) {
        select.addOptions({
            label: value.name,
            value: key,
            emoji: value.emoji,
        })
    }
        
    return {
        contents: "",
        embeds: [embed],
        components: [row]
    }
}

function formatPlayer(username, score, leaderboard, interaction) {
    const userDisplay = username.replaceAll("_", "\\_")
    if (interaction.user.id == username) {
        userDisplay = `__${userDisplay}__` // highlight the user's own score
    }
    return `**${userDisplay}** - \`${formatNumber(score)}\` ${leaderboardTypes[leaderboard].metric}`
}