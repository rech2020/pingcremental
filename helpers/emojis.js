async function fetchEmoji(name, client) {
    // make sure application is fetched and not useless data
    if (!client.application.name) {
        await client.application.fetch();
    }

    // get the emoji from the application
    const emojis = await client.application.emojis.fetch();
    const emoji = emojis.find(emoji => emoji.name === name);

    if (!emoji) {
        return `:${name}:`;
    }

    return `<:${emoji.name}:${emoji.id}>`;
}

module.exports = fetchEmoji;