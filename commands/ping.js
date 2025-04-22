const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, InteractionContextType, MessageFlags } = require('discord.js');
const pingMessages = require('./../helpers/pingMessage.js')
const database = require('./../helpers/database.js')
const upgrades = require('./../helpers/upgrades.js')
const { ownerId } = require('./../config.json');
const formatNumber = require('./../helpers/formatNumber.js')
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
        "again": (async (interaction) => {
            await ping(interaction, false)
        }),
        "super": (async (interaction) => {
            await ping(interaction, true)
        }),
        "delete": (async interaction => {
            await interaction.update({ content: `(bye!)`, components: [] });
            await interaction.deleteReply(interaction.message);
        }),
        "unknown": (async interaction => {
            await interaction.reply({ content: "unknown ping occurs when the bot just restarted. this likely means something changed, so maybe there's new upgrades? if you wait a few seconds, the ping will come back to normal.", flags: MessageFlags.Ephemeral })
        })
    }
};

async function ping(interaction, isSuper = false) {
    // prevent pinging during dev mode
    const developmentMode = process.argv.includes('--dev') || process.argv.includes('-d');
    if (developmentMode && interaction.user.id !== ownerId) {
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

    let againId = 'ping:again';
    const again = new ButtonBuilder()
        .setCustomId(againId)
        .setLabel('ping again!')
        .setStyle(ButtonStyle.Secondary);
    let row = new ActionRowBuilder();

    if (interaction.client.ws.ping === -1 && !developmentMode) { // bot just restarted
        row.addComponents(again, new ButtonBuilder()
            .setCustomId('ping:unknown')
            .setLabel('unknown ms?')
            .setStyle(ButtonStyle.Secondary));
        return await interaction.update({ // return early 
            content: `${pingMessages(interaction.client.ws.ping, { user: interaction.user })}`,
            components: [row]
        })
    }

    let ping = interaction.client.ws.ping;
    if (developmentMode) {
        ping = 6; // for testing purposes; prevents too much point gain & bypasses unknown ping
    }
    ping += Math.round(Math.random() * MAX_PING_OFFSET * 2) - MAX_PING_OFFSET; // randomize a bit since it only updates occasionally

    const [playerProfile, _created] = await database.Player.findOrCreate({ where: { userId: interaction.user.id } })

    let pingMessage = pingMessages(ping, 
        { // context for message uniqueness
            user: interaction.user, 
            score: playerProfile.score, 
            clicks: playerProfile.clicks, 
            isSuper: isSuper 
        }
    );

    // add slumber clicks if offline for long enough
    if (playerProfile.upgrades.slumber && Date.now() - playerProfile.lastPing >= 1000 * 60 * (21 - playerProfile.upgrades.slumber)) {
        playerProfile.slumberClicks += Math.floor((Date.now() - playerProfile.lastPing) / (1000 * 60 * (21 - playerProfile.upgrades.slumber)));
        playerProfile.slumberClicks = Math.min(playerProfile.slumberClicks, Math.round((2 * 24 * 60) / (21 - playerProfile.upgrades.slumber))); // max of 2 days of slumber clicks
        playerProfile.slumberClicks = Math.max(playerProfile.slumberClicks, 0); // no negative slumber clicks
    }

    // prep a bunch of variables for the effects
    let currentEffects = {
        mults: [isSuper ? 15 : 1],
        blue: 0,
        special: [],
        // add more if needed
    }
    let addDisplay = [`<:ping:1361883358832885871> \`+${ping}\``];
    let multDisplay = [];
    let extraDisplay = [];
    if (isSuper) multDisplay.push(`<:upgrade_blue:1361881310544527542> __\`x15\`__`);
    let effect;
    let score = ping; // base score is ping

    for (const [upgradeId, level] of Object.entries(playerProfile.upgrades)) {
        effect = upgrades[upgradeId].getEffect(level,
            { // LONG EVIL CONTEXT (will kill you if it gets the chance)
                ping,
                blue: currentEffects.blue,
                clicks: playerProfile.clicks,
                rare: pingMessage.includes('0.1%'),
                isSuper: isSuper,
                slumberClicks: playerProfile.slumberClicks,
                glimmerClicks: playerProfile.glimmerClicks,
            }
        );

        let effectString = upgrades[upgradeId].getDetails().emoji;

        // apply effects where appropriate
        if (effect.add && effect.add !== 0) {
            score += effect.add;
            effectString += ` \`+${effect.add}\``
        }

        if (effect.multiply && effect.multiply !== 1) {
            currentEffects.mults.push(effect.multiply);

            // prevent floating point jank
            const formattedMultiplier = effect.multiply.toFixed(2)

            effectString += ` __\`x${formattedMultiplier}\`__`
        }

        if (effect.blue) { currentEffects.blue += effect.blue; }
        if (effect.special) { currentEffects.special.push(effect.special); }
        if (effect.message) { effectString += ` ${effect.message}`; }

        // add to display
        if (effectString !== upgrades[upgradeId].getDetails().emoji) {
            if (effect.add) {
                addDisplay.push(effectString);
            } else if (effect.multiply) {
                multDisplay.push(effectString);
            } else {
                extraDisplay.push(effectString);
            }
        }
    }

    // some special effects are applied here
    if (currentEffects.special.includes('slumber')) {
        playerProfile.slumberClicks--;
    }
    if (currentEffects.special.includes('gainGlimmer')) {
        playerProfile.glimmerClicks += 5;
    }
    if (currentEffects.special.includes('glimmer')) {
        playerProfile.glimmerClicks--;
    }

    const rowComponents = [];
    // blue ping handling
    if (!currentEffects.special.includes('budge')) {
        rowComponents.push(again);
    }
    // check if blue ping should trigger
    if (Math.random() * 1000 < currentEffects.blue * 10) {
        let combo = false;
        if (isSuper) {
            combo = 1;
            for (const messageButton of interaction.message.components[0].components) { // check every button in the first row
                if (messageButton.data.custom_id === 'ping:super') {
                    combo = (parseInt(messageButton.data.label.split('x')[1]) || 1) + 1; // get the current combo
                }
            }
        }

        if (combo && combo > playerProfile.highestBlueStreak) {
            playerProfile.highestBlueStreak = combo;
        }
        
        playerProfile.bluePings += 1;
        const superPing = new ButtonBuilder()
            .setCustomId('ping:super')
            .setLabel(`blue ping!${isSuper ? ` x${combo}` : ''}`)
            .setStyle(ButtonStyle.Primary);
        rowComponents.push(superPing);

        // if not rare, refresh the message because context is different
        if (!pingMessage.includes('0.1%')) pingMessage = pingMessages(ping, { user: interaction.user, score: playerProfile.score, clicks: playerProfile.clicks, spawnedSuper: true });
    }
    if (currentEffects.special.includes('budge')) {
        rowComponents.push(again);
    }

    // add mults at the end so they're actually effective
    for (const mult of currentEffects.mults) {
        score *= mult;
    }
    score = Math.round(score);

    // apply stats and save
    playerProfile.clicks += 1;
    playerProfile.score += score;
    playerProfile.totalScore += score;
    if (pingMessage.includes('0.1%')) playerProfile.luckyPings += 1;
    playerProfile.lastPing = Date.now();

    if (!isSuper) {
        let missed = false;
        for (const messageButton of interaction.message.components[0].components) { // check every button in the first row
            if (messageButton.data.custom_id === 'ping:super') {
                missed = true;
                break;
            }
        }
        if (missed) playerProfile.bluePingsMissed += 1; // if the button is still there, it means they didn't click it
    }

    await playerProfile.save();

    // show upgrade popup after 150 clicks
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

    if (pingMessage.includes('0.1%')) {
        row = new ActionRowBuilder()
            .addComponents(new ButtonBuilder()
                .setCustomId('ping:again')
                .setLabel('whoa!')
                .setStyle(ButtonStyle.Success)
                .setDisabled(true),
            );
    } else {
        row = new ActionRowBuilder()
            .addComponents(rowComponents);
    }

    try {
        // update ping
        await interaction.update({
            content:
                `${pingMessage}
\`${formatNumber(playerProfile.score)} pts\` (**\`+${formatNumber(score)}\`**)\n-# ${addDisplay.join(', ')}${multDisplay.length !== 0 ? "," : ""} ${multDisplay.join(', ')}`,
            components: [row]
        });
    } catch (error) {
        // automod error, since it doesn't like some messages
        if (error.code == 200000) {
            await interaction.update({
                content:
                    `this ping message is non-offensive, and contains nothing that will anger AutoMod! (${ping}ms)
\`${formatNumber(playerProfile.score)} pts\` (**\`+${formatNumber(score)}\`**)\n-# ${addDisplay.join(', ')}${multDisplay.length !== 0 ? "," : ""} ${multDisplay.join(', ')}`,
                components: [row]
            });
        } else {
            throw error; // rethrow if not automod 
        }
    }

    if (pingMessage.includes('0.1%')) {
        await (new Promise(resolve => setTimeout(resolve, 2000))); // wait a bit
        await interaction.editReply({
            components: [new ActionRowBuilder().addComponents(rowComponents)], // refresh buttons
        })
    }
}
