const { ownerId } = require('./../config.json');

module.exports = {
    log: async (error, client) => {
        console.log(`[ERROR] ${error}`)
        await client.users.fetch(ownerId).then(user => {
            user.send(`[ERROR] ${error}`)
        })
    }
}