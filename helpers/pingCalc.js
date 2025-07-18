const database = require('./database.js')
const { rawUpgrades } = require('./upgrades.js')
const formatNumber = require('./formatNumber.js')
const { getEmoji } = require('./emojis.js');
const getLatestVersion = require('./versions.js');
const { artisanSymbols } = require('../upgrades/fabrics/skill/artisan.js');
const MAX_PING_OFFSET = 5;

async function ping(interaction, isSuper = false, overrides = {}) {
    let ping = interaction.client.ws.ping;
    if (overrides.developmentMode) {
        ping = 6; // for testing purposes; prevents too much point gain & bypasses unknown ping
    }
    ping += Math.round(Math.random() * MAX_PING_OFFSET * 2) - MAX_PING_OFFSET; // randomize a bit since it only updates occasionally

    const [playerProfile, _created] = await database.Player.findOrCreate({ where: { userId: overrides.userId || interaction.user.id } })
    let context = { // BIG LONG EVIL CONTEXT (will kill you if it gets the chance)
        // actual context
        user: overrides.userId ? { id: overrides.userId } : interaction.user,
        ping: ping,
        isSuper: isSuper,
        versionNumber: await getLatestVersion(),

        // player profile bits
        score: playerProfile.score,
        clicks: playerProfile.clicks,
        totalClicks: playerProfile.totalClicks,
        pip: playerProfile.pip,
        removedUpgrades: playerProfile.removedUpgrades,
        missedBluePings: playerProfile.bluePingsMissed,
        lastPing: playerProfile.lastPing,

        // per-upgrade vars
        slumberClicks: playerProfile.slumberClicks,
        glimmerClicks: playerProfile.glimmerClicks,
        artisanClickedSymbol: null,
        artisanNextSymbols: [],
        
        // updated vars
        spawnedSuper: false,
        rare: false,
        blue: 0,
        blueStrength: 1,
        specials: {},
        RNGmult: 1,
        blueCombo: 0,
    }

    let iterateUpgrades = {}
    for (const upgradeTypeList of [playerProfile.upgrades, playerProfile.prestigeUpgrades]) {
        if (!upgradeTypeList) continue;
        for (const [upg, lv] of Object.entries(upgradeTypeList)) iterateUpgrades[upg] = lv;
    }


    /* PRE-PTS CALCULATION */
    

    // prep a bunch of variables for the effects
    let currentEffects = {
        mults: [],
        exponents: [],
        blue: 0,
        blueStrength: 1,
        specials: {},
        bp: 0,
        RNGmult: overrides.forceNoRNG ? 0 : 1,
        // add more if needed
        
        // will be updated later
        blueCombo: 0, rare: false, spawnedSuper: false, bpMax: 10000,
    }
    let displays = {
        add: [],
        mult: [],
        exponents: [],
        extra: [],
        bp: [],
    }
    const pingFormat = playerProfile.settings.pingFormat || "expanded";
    if (pingFormat === "expanded") {
        displays.add.push(`${getEmoji('ping')} \`+${ping}\``);
    } else if (pingFormat === "compact") {
        displays.add.push(`${getEmoji('ping')}`);
    }
    let effect;
    let score = ping; // base score is ping


    for (const [upgradeId, level] of Object.entries(iterateUpgrades)) {
        effect = rawUpgrades[upgradeId].getEffect(level, context);
        if (effect.special) {
            for (const [special, value] of Object.entries(effect.special)) {
                currentEffects.specials[special] = value;
            }
        }
        if (effect.blue) { 
            currentEffects.blue += effect.blue; 
            context.blue = currentEffects.blue; 
        }
        if (effect.blueStrength) { 
            currentEffects.blueStrength += effect.blueStrength; 
            context.blueStrength = currentEffects.blueStrength; 
        }
        if (effect.RNGmult) { 
            currentEffects.RNGmult += effect.RNGmult; 
            context.RNGmult = currentEffects.RNGmult; 
        }
    }

    currentEffects.blue = Math.min(currentEffects.blue, 35 + (currentEffects.specials.blueCap || 0)); // cap blue at 35%

    if (isSuper) {
        let blueStrength = (currentEffects.blueStrength) * 15;
        currentEffects.mults.push(blueStrength);
        if (pingFormat === "expanded") {
            displays.mult.push(`${getEmoji('upgrade_blue')} __\`x${blueStrength.toFixed(2)}\`__`)
        } else if (pingFormat === "compact") {
            displays.mult.push(`${getEmoji('upgrade_blue')}`)
        }

        for (const messageButton of interaction.message.components[0].components) { // check every button in the first row
            if (messageButton.data.custom_id === 'ping:super') {
                context.blueCombo = (parseInt(messageButton.data.label.split('x')[1]) || 1); // get the current combo
            }
        }
    }

    if (Math.random() * 1000 < (currentEffects.blue * 10) && currentEffects.specials.blueping) {
        context.spawnedSuper = true;
    }
    if ((Math.random() * 1000 < 1 * currentEffects.RNGmult)) {
        context.rare = true;
    }

    if (context.specials.artisan) {
        // extracts the symbol from the button label (looks gross though)
        context.artisanClickedSymbol = interaction.component.label.match(new RegExp(`[${artisanSymbols.join('')}]`))[0];
        
        context.artisanNextSymbols = artisanSymbols;
        // shuffle
        for (let i = context.artisanNextSymbols.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [context.artisanNextSymbols[i], context.artisanNextSymbols[j]] = [context.artisanNextSymbols[j], context.artisanNextSymbols[i]];
        }
    }
    
    context.specials = currentEffects.specials; // update context for later effects
    
    
    /* PTS CALCULATION */

    
    for (const [upgradeId, level] of Object.entries(iterateUpgrades)) {
        const upgradeClass = rawUpgrades[upgradeId];
        effect = upgradeClass.getEffect(level,context);

        let effectString = upgradeClass.getDetails().emoji;

        // apply effects where appropriate
        if (effect.add && effect.add !== 0) {
            score += effect.add;
            effectString += ` \`${effect.add >= 0 ? "+" : ""}${formatNumber(effect.add)}\``
        }

        if (effect.multiply && effect.multiply !== 1) {
            currentEffects.mults.push(effect.multiply);

            // prevent floating point jank
            const formattedMultiplier = effect.multiply.toFixed(2)

            effectString += ` __\`x${formattedMultiplier}\`__`
        }

        if (effect.exponent && effect.exponent !== 1) {
            currentEffects.exponents.push(effect.exponent);
            effectString += ` **__\`^${effect.exponent.toFixed(2)}\`__**`
        }

        if (effect.special) { 
            for (const [special, value] of Object.entries(effect.special)) {
                if (!currentEffects.specials[special]) currentEffects.specials[special] = value;
            }
        }

        if (effect.bp) { 
            currentEffects.bp += effect.bp;
            effectString += ` \`+${effect.bp} bp\``
        }

        if (pingFormat === "compact" && effectString !== upgradeClass.getDetails().emoji) {
            effectString = `${upgradeClass.getDetails().emoji}~`;
        }
        
        // bypasses compact mode
        if (effect.message) { effectString += ` ${effect.message}`; }
        
        if (pingFormat === "compact emojiless") {
            effectString = "";
        }

        // add to display
        if (effectString !== upgradeClass.getDetails().emoji && effectString !== "") {
            if (effectString.includes("~")) {
                effectString = effectString.replace("~", "");
            }

            if (effect.add) {
                displays.add.push(effectString);
            } else if (effect.multiply) {
                displays.mult.push(effectString);
            } else if (effect.exponent) {
                displays.exponents.push(effectString);
            } else if (effect.bp) {
                displays.bp.push(effectString);
            } else if (effect.message) {
                displays.extra.push(effectString);
            }
        }
    }

    if (pingFormat !== "expanded") {
        displays.add.push(`\`+${formatNumber(score)}\``);
        if (currentEffects.bp) {
            displays.bp.push(`\`+${formatNumber(currentEffects.bp)} bp\``);
        }
    }


    score = Math.max(score, 1); // prevent negative scores

    let totalMult = 1;
    // add mults at the end so they're actually effective
    for (const mult of currentEffects.mults) {
        score *= mult;
        totalMult *= mult;
    }

    if (totalMult > 1 && pingFormat !== "expanded") {
        displays.mult.push(`__\`x${totalMult.toFixed(2)}\`__`);
    }

    let totalExp = 1;
    for (const exponent of currentEffects.exponents) {
        score = Math.pow(score, exponent);
        totalExp *= exponent;
    }

    if (totalExp > 1 && pingFormat !== "expanded") {
        displays.exponents.push(`**__\`^${totalExp.toFixed(2)}\`__**`);
    }

    score = Math.round(score);
    if (score === Infinity) score = 0; // prevent infinite score (and fuck you; you get nothing)
    context.score = score; // update context for later effects
    
    let bpMax = ((playerProfile.upgrades.limit || 0) + 1) * 10000;
    bpMax += (playerProfile.prestigeUpgrades.storage || 0) * 2500;

    // move all the spare stuff into currentEffects so it's nice and organized
    for (const x of ['spawnedSuper', 'rare', 'blueCombo', 'artisanNextSymbols']) {
        currentEffects[x] = context[x]
    }
    currentEffects.bpMax = bpMax;

    return {
        score,
        displays,
        currentEffects,
        context,
    }
}

module.exports = ping;