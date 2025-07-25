const { AttachmentBuilder } = require('discord.js');
const ownerId = process.env.OWNER_ID
const fs = require('fs');

module.exports = async (error, client, rawError) => {
    console.log(`[ERROR] ${error}`, rawError)

    const user = await client.users.fetch(ownerId);

    if (rawError && rawError.stack) {
        fs.appendFileSync('errorLog.txt', `${rawError ? rawError.stack : ""}`);
        const attachment = new AttachmentBuilder('errorLog.txt');
        await user.send({ content: `[ERROR] ${error}`, files: [attachment] })
        fs.rmSync('errorLog.txt');
    } else {
        await user.send(`[ERROR] ${error}`);
    }
}