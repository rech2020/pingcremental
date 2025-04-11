const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const pingMessages = require('./../helpers/pingMessage.js')
const database = require('./../helpers/database.js')
const MAX_PING_OFFSET = 5

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('ping!'),
	async execute(interaction) {
		const again = new ButtonBuilder()
			.setCustomId('ping:again')
			.setLabel('ping again!')
			.setStyle(ButtonStyle.Secondary);
		const row = new ActionRowBuilder()
			.addComponents(again);

		let pingmessage = pingMessages(interaction.client.ws.ping, { user: interaction.user })

		await interaction.reply({
			content: `${pingmessage}`,
			components: [row]
		});
	},
    buttons: {
        "again": (async interaction => {
            await ping(interaction,false)
        })
    }
};

async function ping(interaction, isSuper) {
    let ping = interaction.client.ws.ping;

    const again = new ButtonBuilder()
        .setCustomId('ping:again')
        .setLabel('ping again!')
        .setStyle(ButtonStyle.Secondary);
    const row = new ActionRowBuilder()
        .addComponents(again);

    if (ping === -1) {
        return await interaction.update({
            content: `${pingMessages(ping, { user: interaction.user })}`,
            components: [row]
        })
    }

    ping += Math.round(Math.random()*MAX_PING_OFFSET*2) - MAX_PING_OFFSET;
    const [playerProfile, _created] = await database.Player.findOrCreate({ where: { userId: interaction.user.id } })
    playerProfile.score += ping;
    playerProfile.clicks += 1;
    // do upgrades stuff here
    await playerProfile.save();

    if (playerProfile.clicks === 350) {
        again.setDisabled(true);
        const disabledRow = new ActionRowBuilder().addComponents(again);

        await interaction.update({
            content: `${pingMessages(ping, { user: interaction.user, score: playerProfile.score, clicks: playerProfile.clicks })}
            \`${score} pts\`}
            you have a lot of pts... why don't you go spend them over in </upgrade:[ID]>?`, // TODO: change to dynamically use ID
            components: [disabledRow]
        })
        
        await new Promise(resolve => setTimeout(resolve,1500)) // wait 1.5s
        return await interaction.update({
            components: [row]
        })
    }

    await interaction.update({
        content: `${pingMessages(ping, { user: interaction.user, score: playerProfile.score, clicks: playerProfile.clicks })}\n\`${score} pts\`}`,
        components: [row]
    });
}