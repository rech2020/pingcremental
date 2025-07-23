const { Events } = require('discord.js')
const { initEmojis } = require('./../helpers/emojis.js')
const { cacheCommandIds } = require('./../helpers/embedCommand.js')

module.exports = {
    name: Events.ClientReady,
    async execute(client) {
        console.log("goood morning!")
        await initEmojis(client)
        await cacheCommandIds();
    },
    once: true,
}