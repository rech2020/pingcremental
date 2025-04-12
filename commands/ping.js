const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const pingMessages = require('./../helpers/pingMessage.js')
const database = require('./../helpers/database.js')
const upgrades = require('./../helpers/upgrades.js')
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
        }),
        "super": (async interaction => {
            await ping(interaction,true)
        }),
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
    let score = ping;
    
    const [playerProfile, _created] = await database.Player.findOrCreate({ where: { userId: interaction.user.id } })
    
    let pingMessage = pingMessages(ping, { user: interaction.user, score: playerProfile.score, clicks: playerProfile.clicks, isSuper: isSuper })
    let currentEffects = {
        mults: [isSuper ? 15 : 1],
        blue: 0,
        // more if needed
    }
    let effect;

    for (const [upgradeId, level] of Object.entries(playerProfile.upgrades)) {
        effect = upgrades[upgradeId].getEffect(level, 
            { ping, blue: currentEffects.blue, clicks: playerProfile.clicks, rare: pingMessage.includes('0.1% chance') } // big long context
        );
        if (effect.add) { score += effect.add; }
        if (effect.multiply) { currentEffects.mults.push(effect.multiply); }
        if (effect.blue) { currentEffects.blue += effect.blue; }
    }

    if (Math.random() * 1000 < currentEffects.blue*10) {
        const superPing = new ButtonBuilder()
            .setCustomId('ping:super')
            .setLabel('blue ping!')
            .setStyle(ButtonStyle.Primary);
        row.addComponents(superPing);
        pingMessage = pingMessages(ping, { user: interaction.user, score: playerProfile.score, clicks: playerProfile.clicks, spawnedSuper: true });
    }

    for (const mult of currentEffects.mults) {
        score *= mult;
    }
    score = Math.round(score);

    playerProfile.clicks += 1;
    playerProfile.score += score;
    await playerProfile.save();

    if (playerProfile.clicks === 150) {
        const button = new ButtonBuilder()
            .setLabel('that looks important...')
            .setStyle(ButtonStyle.Secondary)
            .setCustomId('ping:empty')
            .setDisabled(true);
        const disabledRow = new ActionRowBuilder().addComponents(button);

        return await interaction.update({
            content: 
`${pingMessage}
\`${playerProfile.score} pts\`
you have a lot of pts... why don't you go spend them over in </upgrade:1360377407109861648>?`, // TODO: change to dynamically use ID
            components: [disabledRow]
        })
    }

    await interaction.update({
        content: `${pingMessage}\n\`${playerProfile.score} pts\` (\`+${score}\`)`,
        components: [row]
    });
}