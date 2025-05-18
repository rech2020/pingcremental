const { Events } = require('discord.js')
const { initEmojis } = require('./../helpers/emojis.js')

module.exports = {
    name: Events.ClientReady,
    async execute(client) {
        console.log("goood morning!")
        await initEmojis(client) // initialize emojis for upgrades and stuff
    },
    once: true,
}