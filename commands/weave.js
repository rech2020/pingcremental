const formatNumber = require("../helpers/formatNumber");
const { rawUpgrades } = require("../helpers/upgrades");
const { SlashCommandBuilder, EmbedBuilder, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const database = require("../helpers/database");


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
        // TODO: implement shop
    }

    if (section === WEAVE_SECTION.Cloths) {
        embed.setTitle("fabrics")
            .setDescription(`you have **${player.ownedFabrics.length}** total fabrics.`);

        for (const fabricName of player.ownedFabrics) {
            const fabricUpgrade = rawUpgrades[fabricName];
            if (!fabricUpgrade) continue; // somehow invalid

            embed.addFields({
                name: fabricUpgrade.name,
                value: `${fabricUpgrade.description}`,
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

export function getGainedThread() {
    return 100; // probably change later
}

export function getTearRequirement(tears) {
    return tears * 2 + 3; // TODO: placeholder calculation
}