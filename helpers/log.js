const { AttachmentBuilder } = require('discord.js');
const ownerId = process.env.OWNER_ID
const fs = require('fs');

module.exports = async (error, client, rawError) => {
    console.log(`[ERROR] ${error}`, rawError)

    fs.appendFileSync('errorLog.txt', `${rawError ? rawError.stack : ""}`);
    const attachment = new AttachmentBuilder('errorLog.txt');
    const user = await client.users.fetch(ownerId);
    await user.send({ content: `[ERROR] ${error}${rawError ? "" : "no stack trace!"}`, files: [attachment] })
    fs.rmSync('errorLog.txt');
}