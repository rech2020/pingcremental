const { ownerId } = require('./../config.json');

module.exports = async (error, client, rawError) => {
    console.log(`[ERROR] ${error}`, rawError)
    await client.users.fetch(ownerId).then(user => {
        user.send(`[ERROR] ${error}\n\`\`\`${rawError ? rawError.stack : "no raw error info"}\`\`\``)
    })
}