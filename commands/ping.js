const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, InteractionContextType, MessageFlags, EmbedBuilder } = require('discord.js');
const pingMessages = require('./../helpers/pingMessage.js')
const ownerId = process.env.OWNER_ID
const formatNumber = require('./../helpers/formatNumber.js')
const ping = require('./../helpers/pingCalc.js');
const awardBadge = require('../helpers/awardBadge.js');
const { getEmbeddedCommand } = require('../helpers/embedCommand.js');
const database = require('../helpers/database.js');

let recentPingCache = {};
let shutoutList = {};

// don't leak memory! isn't that smart
setInterval(() => {
    const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
    for (const [userId, lastPingTime] of Object.entries(recentPingCache)) {
        if (lastPingTime < tenMinutesAgo) {
            delete recentPingCache[userId];
        }
    }
}, 10 * 60 * 1000);

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
            await pingResponse(interaction, false)
        }),
        "super": (async (interaction) => {
            await pingResponse(interaction, true)
        }),
        "delete": (async interaction => {
            await interaction.update({ content: `(bye!)`, components: [] });
            await interaction.deleteReply(interaction.message);
        }),
        "unknown": (async interaction => {
            await interaction.reply({ content: "unknown ping occurs when the bot just restarted. either something has gone horribly wrong, or something was changed! maybe some new stuff was added, maybe a bug was fixed. you can check the [github](<https://github.com/MonkeysWithPie/pingcremental/>) if you're curious. if you wait a few seconds, the ping will come back to normal.", flags: MessageFlags.Ephemeral })
        }),
        "alive": (async interaction => {
            if (Date.now() > shutoutList[interaction.user.id]) {
                return await interaction.update({
                    content: "bad news... you were too slow. check the ping message for more details.",
                    components: [],
                    embeds: [],
                });
            }
            delete shutoutList[interaction.user.id]; 
            recentPingCache[interaction.user.id] = 0;

            await interaction.update({ content: "thanks for checking in!", components: [], embeds: [] });
        }),
    }
};

async function pingResponse(interaction, isSuper = false) {
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

    if (shutoutList[interaction.user.id] && Date.now() > shutoutList[interaction.user.id]) {
        const allowTime = shutoutList[interaction.user.id] + 1000 * 60 * 60 * 2; // 2h block time
        if (allowTime < Date.now()) { // blockout is over
            delete shutoutList[interaction.user.id];
            recentPingCache[interaction.user.id] = 0;
        } else {
            return await interaction.update({
                components: [new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('ping:again')
                        .setLabel('again...?')
                        .setStyle(ButtonStyle.Secondary)
                )],
                embeds: [new EmbedBuilder()
                    .setColor("#ff0000")
                    .setTitle('autoclicking detected...')
                    .setDescription(`
sorry, but looks like you were autoclicking, which is **strictly disallowed**. 
if this was a mistake, it's best to wait it out, but if you really want to, contact the developer (@monkeyswithpie).
otherwise, use this cooldown to think about what you've done. autoclicking really defeats the point of the game, and i really thought better of you... 

you can ping again in **<t:${Math.floor(allowTime/1000)}:R>**.`
                    )
                ],
                content: ""
            })   
        }
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
            components: [row],
            embeds: [],
        })
    }

    const {score, displays, currentEffects, context} = await ping(interaction, isSuper, { developmentMode});
    const playerProfile = await database.Player.findByPk(`${interaction.user.id}`);
    const pingFormat = playerProfile.settings.pingFormat || "expanded";

    // funky specials

    if (currentEffects.specials.slumber) {
        playerProfile.slumberClicks += currentEffects.specials.slumber;
    }
    if (currentEffects.specials.glimmer) {
        playerProfile.glimmerClicks += currentEffects.specials.glimmer;
    }

    const rowComponents = [];
    // blue ping handling
    if (!currentEffects.specials.budge) {
        rowComponents.push(again);
    }
    // check if blue ping should trigger
    if (currentEffects.spawnedSuper) {
        playerProfile.bluePings += 1;
        const superPing = new ButtonBuilder()
            .setCustomId('ping:super')
            .setLabel(`blue ping!${isSuper ? ` x${currentEffects.blueCombo + 1}` : ''}`)
            .setStyle(ButtonStyle.Primary);
        rowComponents.push(superPing);
    }
    if (currentEffects.specials.budge) {
        if (!currentEffects.specials.bully) rowComponents.push(again);
    }

    /* SAVE STATS */

    context.totalScore = playerProfile.score + score;
    const pingMessage = pingMessages(context.ping, context); // get the ping message

    // click saving
    playerProfile.clicks += 1;
    playerProfile.totalClicks += 1;
    if (playerProfile.clicks > playerProfile.totalClicks) playerProfile.totalClicks = playerProfile.clicks; // make sure total clicks is always higher than clicks
    if (currentEffects.rare) playerProfile.luckyPings += 1;
    if (currentEffects.blueCombo > playerProfile.highestBlueStreak) playerProfile.highestBlueStreak = currentEffects.blueCombo;
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

    // score saving
    playerProfile.score += score;
    playerProfile.totalScore += score;
    if (playerProfile.highestScore < score) playerProfile.highestScore = score;

    // etc
    playerProfile.bp = Math.min(currentEffects.bp + playerProfile.bp, currentEffects.bpMax);
    playerProfile.apt += currentEffects.apt || 0;
    playerProfile.lastPing = Date.now();


    // badges
    if (currentEffects.blueCombo >= 10) { 
        await awardBadge(interaction.user.id, 'blue stupor', interaction.client); 
    }
    if (currentEffects.rare) {
        await awardBadge(interaction.user.id, 'lucky', interaction.client);
    }
    if (playerProfile.totalClicks >= 10000) {
        await awardBadge(interaction.user.id, 'heavy hands', interaction.client);
    }

    await playerProfile.save();

    // show upgrade popup after 150 clicks
    if (playerProfile.totalClicks === 150) {
        const button = new ButtonBuilder()
            .setLabel('that looks important...')
            .setStyle(ButtonStyle.Secondary)
            .setCustomId('ping:empty')
            .setDisabled(true);
        const disabledRow = new ActionRowBuilder().addComponents(button);

        return await interaction.update({
            content:
                `${pingMessage}
you have a lot of \`pts\`... why don't you go spend them over in ${await getEmbeddedCommand(`upgrade`)}?`, 
            components: [disabledRow],
            embeds: [],
        })
    }

    if (currentEffects.rare) {
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
    for (const dispType of ['add', 'mult', 'exponents', 'extra']) {
        const display = displays[dispType];
        if (display.length === 0) continue; // skip empty displays
        if (pingFormat === "expanded") {
            displayDisplay += ", " + display.join(', ') 
        } else {
            displayDisplay += ", " + display.join(' ')
        }

    }
    displayDisplay = displayDisplay.substring(2); // remove first comma and space
    
    if (currentEffects.apt) {
        displayDisplay += `\n-# \`${formatNumber(playerProfile.apt)} APT\` `
        if (pingFormat === "expanded") {
            displayDisplay += displays.apt.join(', ');
        } else if (pingFormat === "compact") {
            displayDisplay += displays.apt.join(' ');
        }
    }

    if (currentEffects.bp) {
        displayDisplay += `\n-# \`${formatNumber(Math.ceil(playerProfile.bp))}/${formatNumber(currentEffects.bpMax)} bp\`${playerProfile.bp >= currentEffects.bpMax ? " **(MAX)**" : ""} `
        if (pingFormat === "expanded") {
            displayDisplay += displays.bp.join(', ');
        } else if (pingFormat === "compact") {
            displayDisplay += displays.bp.join(' ');
        }
    }

    try {
        // update ping
        await interaction.update({
            content:
                `${pingMessage}
\`${formatNumber(playerProfile.score, true, 4)} pts\` (**\`+${formatNumber(score, true, 3)}\`**)\n-# ${displayDisplay}`,
            components: [row],
            embeds: [],
        });
    } catch (error) {
        // automod error, since it doesn't like some messages
        if (error.code == 200000) {
            await interaction.update({
                content:
                    `this ping message is non-offensive, and contains nothing that will anger AutoMod! (${ping}ms)
\`${formatNumber(playerProfile.score, true, 4)} pts\` (**\`+${formatNumber(score, true, 3)}\`**)\n-# ${displayDisplay}`,
                components: [row],
                embeds: [],
            });
        } else {
            throw error; // rethrow if not automod 
        }
    }

    // autoclicker check
    const last = playerProfile.lastPing || 0;
    if (last > 0 && Date.now() - last < 2500) { // pinged recently
        recentPingCache[interaction.user.id] = (recentPingCache[interaction.user.id] || 0) + 1;
        const recentPings = recentPingCache[interaction.user.id];

        if (recentPings >= 65 && (Math.random() < recentPings/1000) && !shutoutList[interaction.user.id]) {
            shutoutList[interaction.user.id] = Date.now() + 1000 * 60 * 2; // disallow pings in 2 mins

            const userAliveEmbed = new EmbedBuilder()
                .setColor("#ff0000")
                .setTitle('you still there?')
                .setDescription(
`just making sure you're still paying attention! 
you have until **<t:${Math.floor((shutoutList[interaction.user.id] / 1000))}:R>** to respond to this message by clicking the button below.

-# autoclicking is not allowed. this is a game about clicking, after all! 
-# don't worry if you've come across this normally, there's no punishment unless you don't respond!`)

            const row = new ActionRowBuilder()
            const leftPad = Math.floor((Math.random() * 4) + 1); // random left padding
            for (let i = 0; i < leftPad; i++) {
                row.addComponents(new ButtonBuilder()
                    .setCustomId(`ping:align${i}`)
                    .setLabel('-->')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true));
            }
            row.addComponents(new ButtonBuilder()
                .setCustomId('ping:alive')
                .setLabel('yep!')
                .setStyle(ButtonStyle.Secondary));
            for (let i = leftPad + 1; i < 5; i++) {
                row.addComponents(new ButtonBuilder()
                    .setCustomId(`ping:align${i}`)
                    .setLabel('<--')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true));
            }

            await interaction.followUp({
                embeds: [userAliveEmbed],
                components: [row],
                flags: MessageFlags.Ephemeral
            })
        }
    } else {
        recentPingCache[interaction.user.id] = 0;
    }

    if (currentEffects.rare) {
        await (new Promise(resolve => setTimeout(resolve, 2000))); // wait a bit
        await interaction.editReply({
            components: [new ActionRowBuilder().addComponents(rowComponents)], // refresh buttons
        })
    }
}
