const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, InteractionContextType, MessageFlags } = require('discord.js');
const pingMessages = require('./../helpers/pingMessage.js')
const database = require('./../helpers/database.js')
const upgrades = require('./../helpers/upgrades.js')
const MAX_PING_OFFSET = 5

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('ping!')
        .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel),
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
        "delete": (async interaction => {
            await interaction.update(`(bye!)`);
            await interaction.deleteReply(interaction.message);
        }),
    }
};  

async function ping(interaction, isSuper) {
    const developmentMode = process.argv.includes('--dev') || process.argv.includes('-d');
    if (developmentMode && interaction.user.id !== '696806601771974707') {
        return await interaction.update({
            content: "there's some important dev stuff going on! pings are disabled for now, but will (hopefully) be back shortly.",
            components: [new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('ping:again')
                    .setLabel('ping again!')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('ping:delete')
                    .setLabel('dang!')
                    .setStyle(ButtonStyle.Secondary))
            ],
        })
    }
    let ping = interaction.client.ws.ping;

    const again = new ButtonBuilder()
        .setCustomId('ping:again')
        .setLabel('ping again!')
        .setStyle(ButtonStyle.Secondary);
    const row = new ActionRowBuilder();

    if (ping === -1) {
        row.addComponents(again);
        return await interaction.update({
            content: `${pingMessages(ping, { user: interaction.user })}`,
            components: [row]
        })
    }
    
    ping += Math.round(Math.random()*MAX_PING_OFFSET*2) - MAX_PING_OFFSET;
    let score = ping;
    
    const [playerProfile, _created] = await database.Player.findOrCreate({ where: { userId: interaction.user.id } })
    
    if (playerProfile.lastPing - Date.now() >= 1000*60*20 && playerProfile.upgrades.slumber) {
        playerProfile.slumberClicks = Math.floor(playerProfile.lastPing - Date.now() / 1000*60*20);
        playerProfile.slumberClicks = Math.min(playerProfile.slumberClicks, 144); // max of 2 days of slumber clicks
        playerProfile.slumberClicks = Math.max(playerProfile.slumberClicks, 0); // no negative slumber clicks
    }
    let pingMessage = pingMessages(ping, { user: interaction.user, score: playerProfile.score, clicks: playerProfile.clicks, isSuper: isSuper })
    let currentEffects = {
        mults: [isSuper ? 15 : 1],
        blue: 0,
        special: [],
        // more if needed
    }
    let addDisplay = [`<:ping:1361883358832885871> \`+${ping}\``];
    let multDisplay = [];
    if (isSuper) multDisplay.push(`<:upgrade_blue:1361881310544527542> __\`x15\`__`);
    let effect;

    for (const [upgradeId, level] of Object.entries(playerProfile.upgrades)) {
        effect = upgrades[upgradeId].getEffect(level, 
            { ping, blue: currentEffects.blue, clicks: playerProfile.clicks, rare: pingMessage.includes('0.1% chance'), isSuper: isSuper, slumberClicks: playerProfile.slumberClicks } // big long context
        );
        if (effect.add && effect.add !== 0) { 
            score += effect.add;
            addDisplay.push(`${upgrades[upgradeId].getDetails().emoji} \`+${effect.add}\``);
        }
        if (effect.multiply && effect.multiply !== 1) { 
            currentEffects.mults.push(effect.multiply);

            // Handle floating-point errors by rounding to 2 decimal places if necessary
            const formattedMultiplier = Math.abs(effect.multiply - Math.round(effect.multiply * 100) / 100) < 1e-10
                ? effect.multiply.toFixed(2)
                : effect.multiply;

            multDisplay.push(`${upgrades[upgradeId].getDetails().emoji} __\`x${formattedMultiplier}\`__`);
         }
        if (effect.blue) { currentEffects.blue += effect.blue; }
        if (effect.special) { currentEffects.special.push(effect.special); }
    }

    if (currentEffects.special.includes('slumber')) {
        playerProfile.slumberClicks--;
    }

    if (!currentEffects.special.includes('budge')) {
        row.addComponents(again);
    }

    if (Math.random() * 1000 < currentEffects.blue*10) {
        const superPing = new ButtonBuilder()
            .setCustomId('ping:super')
            .setLabel('blue ping!')
            .setStyle(ButtonStyle.Primary);
        row.addComponents(superPing);
        pingMessage = pingMessages(ping, { user: interaction.user, score: playerProfile.score, clicks: playerProfile.clicks, spawnedSuper: true });
    }

    if (currentEffects.special.includes('budge')) {
        row.addComponents(again);
    }

    for (const mult of currentEffects.mults) {
        score *= mult;
    }
    score = Math.round(score);

    playerProfile.clicks += 1;
    playerProfile.score += score;
    playerProfile.totalScore += score;
    playerProfile.lastPing = Date.now();
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
you have a lot of pts... why don't you go spend them over in </upgrade:1360377407109861648>?`, // TODO: change to dynamically use ID
            components: [disabledRow]
        })
    }

    await interaction.update({
        content: 
`${pingMessage}
\`${playerProfile.score} pts\` (**\`+${score}\`**)\n-# ${addDisplay.join(', ')}${multDisplay.length !== 0 ? "," : ""} ${multDisplay.join(', ')}`,
        components: [row]
    });
}