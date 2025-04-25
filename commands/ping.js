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
    let context = { // BIG LONG EVIL CONTEXT (will kill you if it gets the chance)
        user: interaction.user,
        ping: ping,
        score: playerProfile.score,
        clicks: playerProfile.clicks,
        isSuper: isSuper,
        rare: (Math.random() * 1000 < 1), // 0.1% chance to be rare
        slumberClicks: playerProfile.slumberClicks,
        glimmerClicks: playerProfile.glimmerClicks,
        blue: 0,
    }


    /* PRE-PTS CALCULATION */
    

    // prep a bunch of variables for the effects
    let currentEffects = {
        mults: [isSuper ? 15 : 1],
        blue: 0,
        specials: [],
        // add more if needed
    }
    let displays = {
        add: [`<:ping:1361883358832885871> \`+${ping}\``],
        mult: [],
        extra: [],
    }
    if (isSuper) displays.mult.push(`<:upgrade_blue:1361881310544527542> __\`x15\`__`);
    let effect;
    let score = ping; // base score is ping


    for (const [upgradeId, level] of Object.entries(playerProfile.upgrades)) {
        effect = upgrades[upgradeId].getEffect(level, context);
        if (effect.special) {
            if (Array.isArray(effect.special)) { // allow returning multiple specials
                for (const special of effect.special) {
                    currentEffects.specials.push(special);
                }
            } else currentEffects.specials.push(effect.special);
        }
    }   

    // add slumber clicks if offline for long enough
    if (currentEffects.specials.includes('canGainSlumber') && Date.now() - playerProfile.lastPing >= 1000 * 60 * (21 - playerProfile.upgrades.slumber)) {
        playerProfile.slumberClicks += Math.floor((Date.now() - playerProfile.lastPing) / (1000 * 60 * (21 - playerProfile.upgrades.slumber)));
        playerProfile.slumberClicks = Math.min(playerProfile.slumberClicks, Math.round((2 * 24 * 60) / (21 - playerProfile.upgrades.slumber))); // max of 2 days of slumber clicks
        playerProfile.slumberClicks = Math.max(playerProfile.slumberClicks, 0); // no negative slumber clicks
        context.slumberClicks = playerProfile.slumberClicks; // update context for later effects
    }

    
    /* PTS CALCULATION */

    
    for (const [upgradeId, level] of Object.entries(playerProfile.upgrades)) {
        effect = upgrades[upgradeId].getEffect(level,context);

        let effectString = upgrades[upgradeId].getDetails().emoji;

        // apply effects where appropriate
        if (effect.add && effect.add !== 0) {
            score += effect.add;
            effectString += ` \`+${formatNumber(effect.add)}\``
        }

        if (effect.multiply && effect.multiply !== 1) {
            currentEffects.mults.push(effect.multiply);

            // prevent floating point jank
            const formattedMultiplier = effect.multiply.toFixed(2)

            effectString += ` __\`x${formattedMultiplier}\`__`
        }

        if (effect.blue) { 
            currentEffects.blue += effect.blue; 
            context.blue = currentEffects.blue; 
        }
        if (effect.special) { currentEffects.specials.push(effect.special); }
        if (effect.message) { effectString += ` ${effect.message}`; }

        // add to display
        if (effectString !== upgrades[upgradeId].getDetails().emoji) {
            if (effect.add) {
                displays.add.push(effectString);
            } else if (effect.multiply) {
                displays.mult.push(effectString);
            } else {
                displays.extra.push(effectString);
            }
        }
    }



    /* SPECIALS */


    if (currentEffects.specials.includes('slumber')) {
        playerProfile.slumberClicks--;
    }
    if (currentEffects.specials.includes('gainGlimmer')) {
        playerProfile.glimmerClicks += 5;
    }
    if (currentEffects.specials.includes('glimmer')) {
        playerProfile.glimmerClicks--;
    }

    const rowComponents = [];
    // blue ping handling
    if (!currentEffects.specials.includes('budge')) {
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
            playerProfile.highestBlueStreak = combo-1;
        }

        playerProfile.bluePings += 1;
        const superPing = new ButtonBuilder()
            .setCustomId('ping:super')
            .setLabel(`blue ping!${isSuper ? ` x${combo}` : ''}`)
            .setStyle(ButtonStyle.Primary);
        rowComponents.push(superPing);

        context.spawnedSuper = true; // set context for additonal things
        context.blueCombo = combo;
    }
    if (currentEffects.specials.includes('budge')) {
        rowComponents.push(again);
    }

    score = Math.max(score, 1); // prevent negative scores

    // add mults at the end so they're actually effective
    for (const mult of currentEffects.mults) {
        score *= mult;
    }
    score = Math.round(score);
    context.score = score; // update context for later effects

    /* SAVE STATS */

    context.score += score; // update context for later effects
    const pingMessage = pingMessages(ping, context); // get the ping message

    // apply stats and save
    playerProfile.clicks += 1;
    playerProfile.score += score;
    playerProfile.totalScore += score;
    if (context.rare) playerProfile.luckyPings += 1;
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

    if (context.rare) {
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

    let displayDisplay = ""
    for (const display of Object.values(displays)) {
        if (display.length === 0) continue; // skip empty displays
        displayDisplay += ", " + display.join(', ') 
    }
    displayDisplay = displayDisplay.substring(2); // remove first comma and space

    try {
        // update ping
        await interaction.update({
            content:
                `${pingMessage}
\`${formatNumber(playerProfile.score, true, 4)} pts\` (**\`+${formatNumber(score, true, 3)}\`**)\n-# ${displayDisplay}`,
            components: [row]
        });
    } catch (error) {
        // automod error, since it doesn't like some messages
        if (error.code == 200000) {
            await interaction.update({
                content:
                    `this ping message is non-offensive, and contains nothing that will anger AutoMod! (${ping}ms)
\`${formatNumber(playerProfile.score, true, 4)} pts\` (**\`+${formatNumber(score, true, 3)}\`**)\n-# ${displayDisplay}`,
                components: [row]
            });
        } else {
            throw error; // rethrow if not automod 
        }
    }

    if (context.rare) {
        await (new Promise(resolve => setTimeout(resolve, 2000))); // wait a bit
        await interaction.editReply({
            components: [new ActionRowBuilder().addComponents(rowComponents)], // refresh buttons
        })
    }
}
