const { Events } = require('discord.js')
const database = require('./../helpers/database.js');
const sequelize = require('sequelize');

module.exports = {
    name: Events.ClientReady,
    async execute(client) {
        console.log("goood morning!")
        updateLeaderboard()
        setInterval(updateLeaderboard, 60 * 1000)
    },
    once: true,
}

async function updateLeaderboard() {
    await database.LeaderboardPlayer.drop();
    const topPlayers = await database.Player.findAll({
        order: [
            sequelize.fn(sequelize.col('totalScore'), "DESC")
        ],
        limit: 10,
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