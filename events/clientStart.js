const { Events } = require('discord.js')
const database = require('./../helpers/database.js');

module.exports = {
    name: Events.ClientReady,
    async execute(client) {
        console.log("goood morning!")
        updateLeaderboard()
        setInterval(updateLeaderboard, 60 * 1000) // update leaderboard every minute
    },
    once: true,
}

async function updateLeaderboard() {
    await database.LeaderboardPlayer.destroy({ where: {}, truncate: true }); // clear old leaderboard data
    const topPlayers = await database.Player.findAll({
        order: [['totalScore', 'DESC']], // highest first
        attributes: ['userId', 'totalScore'], // only get userId and totalScore
        limit: 10, // top 10 only
    })

    let pos = 0;
    for (player of topPlayers) {
        pos++;
        await database.LeaderboardPlayer.create({
            userId: player.userId,
            score: player.totalScore,
            position: pos,
        })
    }
}