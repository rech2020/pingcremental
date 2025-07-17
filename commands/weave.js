const formatNumber = require("../helpers/formatNumber");
const { rawUpgrades, upgrades } = require("../helpers/upgrades");
const { SlashCommandBuilder, EmbedBuilder, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require("discord.js");
const database = require("../helpers/database");
const { FabricUpgradeTypes } = require("../helpers/upgradeEnums.js");
const { Rand } = require("rand-seed");

const WEAVE_SECTION = {
    Tear: 'tear',
    Shop: 'weave',
    Cloths: 'fabrics',
    Cloak: 'cloak',
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("weave")
        .setDescription("weave the fabric of the universe itself...?"),
    async execute(interaction) {
        return await interaction.reply(await getEmbed(interaction));
    },
    buttons: {
        section: async (interaction, newSection) => {
            return await interaction.update(await getEmbed(interaction, newSection));
        },
        reset: async (interaction) => {
            const player = await database.Player.findByPk(interaction.user.id);

            if (player.eternities < getTearRequirement(player.tears)) {
                return await interaction.reply({
                    content: `you can't.... what?`,
                    flags: MessageFlags.Ephemeral
                });
            }

            player.tears++;
            player.totalTears++;
            player.thread += getGainedThread();
            player.totalThread += getGainedThread();
            player.cloakModificationsAllowed = 1;
            player.shopSeed = getNewSeed();
            player.shopEmptySlots = [];

            playerData.upgrades = {};
            playerData.score = 0;
            playerData.clicks = 0;
            playerData.glimmerClicks = 0;
            playerData.slumberClicks = 0;

            playerData.bp = 0;
            playerData.pip = 0;
            playerData.prestigeUpgrades = {};
            playerData.eternities = 0;

            await player.save();

            await interaction.update(await getEmbed(interaction, WEAVE_SECTION.Tear));
            return await interaction.followUp({
                content: `you tear the universe, and gained **${formatNumber(getGainedThread())}** thread (now ${formatNumber(player.thread)} total).`,
                flags: MessageFlags.Ephemeral
            });
        },
        sew: async (interaction) => {
            const player = await database.Player.findByPk(interaction.user.id);

            if (player.cloakModificationsAllowed <= 0) {
                return await interaction.reply({
                    content: `you can't re-sew your cloak right now; tear the universe again to modify it more.`,
                    flags: MessageFlags.Ephemeral
                });
            }

            // TODO: actually implement this
        },
        delete: async (interaction) => {
            await interaction.update({ content: "(vwoop!)", components: [] });
            await interaction.deleteReply(interaction.message);
        }
    },
    dropdowns: {
        buy: async (interaction) => {
            const fabricName = interaction.values[0];
            if (fabricName === "none") return await interaction.reply({ content: 'you already got everything!', flags: MessageFlags.Ephemeral });

            if (!rawUpgrades[fabricName]) {
                return await interaction.reply({
                    content: `this fabric doesn't exist?`,
                    flags: MessageFlags.Ephemeral
                });
            }

            const fabricUpgrade = rawUpgrades[fabricName];
            const player = await database.Player.findByPk(interaction.user.id);

            if (player.thread < fabricUpgrade.getPrice()) {
                const msg = ['dang it!', 'oh noes!', 'oopsies!', 'shoot!']

                return await interaction.reply({
                    content: `you don't have enough thread for this fabric!`,
                    components: [new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`weave:delete`)
                            .setLabel(msg[Math.floor(Math.random() * msg.length)])
                            .setStyle(ButtonStyle.Secondary)
                    )],
                });
            }

            // because sequelize doesn't like modifying lists directly
            const currentFabrics = player.ownedFabrics || [];
            currentFabrics.push(fabricName);
            const currentEmpty = player.shopEmptySlots || [];
            currentEmpty.push(getShopStock(player.shopSeed).indexOf(fabricName));

            player.thread -= fabricUpgrade.getPrice();
            player.ownedFabrics = currentFabrics;
            player.shopEmptySlots = currentEmpty;

            await player.save();

            await interaction.update(await getEmbed(interaction, WEAVE_SECTION.Shop));

            const msg = ['hell yeah!', 'woo!', 'okay!']
            await interaction.followUp({
                content: `you got **${fabricUpgrade.getDetails().name}** in exchange for **${formatNumber(fabricUpgrade.getPrice())}** thread!`,
                components: [new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`weave:delete`)
                        .setLabel(msg[Math.floor(Math.random() * msg.length)])
                        .setStyle(ButtonStyle.Secondary)
                )]
            })
        }
    }
}

async function getEmbed(interaction, section = WEAVE_SECTION.Shop) {
    const [player, _created] = await database.Player.findOrCreate({ where: { userId: interaction.user.id } });

    if (player.tears <= 0 && player.eternities < getTearRequirement(0)) {
        return { 
            content: "you'd love to try weaving... but regular old cloaks and quilts aren't going to do you any good in your pts gathering. maybe there's something more fundamental you're missing?", 
            flags: MessageFlags.Ephemeral 
        };
    }

    const availableSections = [WEAVE_SECTION.Tear]

    const embed = new EmbedBuilder()
        .setColor('#120830')

    const row = new ActionRowBuilder();
    const extraRow = new ActionRowBuilder();
    
    if (player.tears > 0) {
        availableSections.push(WEAVE_SECTION.Shop);
    } else {
        section = WEAVE_SECTION.Tear; // force this section with no previous tears, since they'll need to do this first
    }
    if (player.ownedFabrics.length > 0) {
        availableSections.push(WEAVE_SECTION.Cloths, WEAVE_SECTION.Cloak);
    }

    for (const sectionName of availableSections) {
        row.addComponents(new ButtonBuilder()
            .setCustomId(`weave:section-${sectionName}`)
            .setLabel(sectionName)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(section === sectionName)
        );
    }

    if (section === WEAVE_SECTION.Tear) {
        let desc = `do you want to tear a bit of the universe?`;

        if (player.tears < 0) {
            desc = 
`to weave, you first need thread.
fortunately, the universe is ready to give you some.
unfortunately, it wants everything you have in return.
` + desc
        }

        desc += `\nthis will reset ALL of your progress (with the exception of Total stats), including pip, bp, pts, and all of their associated upgrades.`
        desc += `\nyou will gain **${formatNumber(getGainedThread())} thread** for tearing the universe.`;
        
        if (player.eternities < getTearRequirement(player.tears)) {
            desc = `the universe isn't quite ready to be torn again yet. you need ${player.eternities}/**${getTearRequirement(player.tears)}** eternities to tear the universe again.`
        }
    
        embed.setTitle("tear the universe?")
        embed.setDescription(desc);
        extraRow.addComponents(new ButtonBuilder()
            .setCustomId(`weave:reset`)
            .setLabel("time to tear!")
            .setStyle(ButtonStyle.Danger)
            .setDisabled(player.eternities < getTearRequirement(player.tears))
        );
    }

    if (section === WEAVE_SECTION.Shop) {
        const stock = getShopStock(player.shopSeed);
        const ownedFabrics = player.ownedFabrics;
        const emptySlots = player.shopEmptySlots;
        const select = new StringSelectMenuBuilder()
            .setCustomId(`weave:buy`)
            .setPlaceholder("choose a fabric")
            .setMinValues(1)
            .setMaxValues(1)

        let desc = `you have **${formatNumber(player.thread)}** thread. the following fabrics are craftable right now:`;
        embed.setFooter({ text: `a new rotation of fabrics will be available after tearing the universe again.` })
        embed.setTitle("")

        for (const fabricName of stock) {
            const fabricUpgrade = rawUpgrades[fabricName];
            if (!fabricUpgrade) continue;

            let isBuyable = true;

            desc += `\n\n**${fabricUpgrade.getDetails().name}**`;

            if (fabricUpgrade.isUnique() && ownedFabrics.includes(fabricName)) {
                desc += `\n*unique* ~ you already own this one-of-a-kind fabric`;
                isBuyable = false;
            } else if (fabricUpgrade.isUnique()) {
                desc += `\n*unique* ~ you can only own one of this fabric`;
            }
            
            if (emptySlots.includes(stock.indexOf(fabricName)) && isBuyable) {
                isBuyable = false;
                desc += `\nalready bought!`;
            } else if (isBuyable) {
                desc += `\ncosts ${formatNumber(fabricUpgrade.getPrice())} thread`;

                if (ownedFabrics.includes(fabricName)) {
                    desc += `\nyou already own **${ownedFabrics.filter(f => f === fabricName).length}** of this fabric`;
                }
            }

            desc += `\n${fabricUpgrade.getDetails().description}`;

            if (isBuyable) {
                select.addOptions([
                    new StringSelectMenuOptionBuilder()
                        .setLabel(fabricUpgrade.getDetails().name)
                        .setValue(fabricName)
                ])
            }
        }

        if (select.options.length === 0) {
            select.addOptions([
                new StringSelectMenuOptionBuilder()
                    .setLabel("all sold out!")
                    .setValue("none")
                    .setDefault(true)
            ])
            select.setDisabled(true);
        }

        embed.setDescription(desc);
        extraRow.addComponents(select);
    }

    if (section === WEAVE_SECTION.Cloths) {
        embed.setTitle("fabrics")
            .setDescription(`you have **${player.ownedFabrics.length}** total fabrics.`);

        const seenFabrics = [];
        
        for (const fabricName of player.ownedFabrics) {
            if (seenFabrics.includes(fabricName)) continue;
            seenFabrics.push(fabricName);

            const fabricUpgrade = rawUpgrades[fabricName];
            if (!fabricUpgrade) continue;

            let nameDisplay = fabricUpgrade.getDetails().name;
            if (fabricUpgrade.isUnique()) {
                nameDisplay += ` (unique)`;
            }
            if (player.ownedFabrics.filter(f => f === fabricName).length > 1) {
                nameDisplay += ` (x${player.ownedFabrics.filter(f => f === fabricName).length})`;
            }

            embed.addFields({
                name: nameDisplay,
                value: fabricUpgrade.description,
                inline: true
            });
        }
    }

    if (section === WEAVE_SECTION.Cloak) {
        embed.setTitle("your cloak")
        
        let desc = `your cloak currently has the following effects:`;
        for (const fabricName of Object.values(player.ownedFabrics)) {
            const fabricUpgrade = rawUpgrades[fabricName];
            if (!fabricUpgrade) continue;

            desc += `\n\n${fabricUpgrade.description}`;
        }

        if (player.cloakModificationsAllowed <= 0) {
            desc += `\n\nyou can't re-sew your cloak right now; tear the universe again to modify it more.`;
        } else {
            desc += `\n\nyou can re-sew your cloak **${player.cloakModificationsAllowed}** more time${player.cloakModificationsAllowed === 1 ? "" : "s"} before having to tear the universe.`;
        }


        if (Object.values(player.ownedFabrics).length === 0) {
            desc = `you don't have a cloak yet! you can sew one now using the fabrics you own.`
        }

        embed.setDescription(desc);
        extraRow.addComponents(new ButtonBuilder()
            .setCustomId(`weave:sew`)
            .setLabel(`${Object.values(player.ownedFabrics).length === 0 ? "" : "re-"}sew your cloak`)
            .setStyle(ButtonStyle.Primary)
            .setDisabled(player.cloakModificationsAllowed <= 0)
        );
    }

    return { embeds: [embed], components: [row, extraRow] };
}

function getNewSeed() {
    return Math.random().toString(36).substring(2, 15);
}

function getShopStock(seed) {
    const rand = new Rand(seed);
    const stock = [];
    const fabrics = upgrades['fabrics'];
    
    while (stock.length < 3) {
        // very specific case where all registered fabrics are unique but there's not enough to fill stock
        if (fabrics.every(f => rawUpgrades[f].isUnique()) 
            && stock.every(f => rawUpgrades[f].isUnique()) 
            && stock.length === fabrics.length) { break; }

        const fabricIndex = Math.floor(rand.next() * fabrics.length);
        const fabric = fabrics[fabricIndex];

        if (rawUpgrades[fabric].isUnique() && stock.some(x => x === fabric)) {
            continue;
        }

        stock.push(fabric);
    }

    return stock;
}

function getGainedThread() {
    return 100; // probably change later
}

export function getTearRequirement(tears) {
    return tears * 2 + 3; // TODO: placeholder calculation
}