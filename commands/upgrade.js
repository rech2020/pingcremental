const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, EmbedBuilder, InteractionContextType } = require('discord.js');
const upgrades = require('./../helpers/upgrades.js')
const database = require('./../helpers/database.js');
const UpgradeTypes = require('./../helpers/upgradeEnums.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('upgrade')
		.setDescription('get stronger pings')
        .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel),
	async execute(interaction) {
        await interaction.reply(await getEditMessage(interaction, UpgradeTypes.ADD_BONUS));
	},
    buttons: {
        delete: (async interaction => {
            await interaction.update(`(bye!)`);
            await interaction.deleteReply(interaction.message);
        }),
        category: (async (interaction, newCategory) => {
            await interaction.update(await getEditMessage(interaction, newCategory));
        })
    },
    dropdowns: {
        buy: (async interaction => {
            const upgradeId = interaction.values[0];
            if (upgradeId === 'none') return await interaction.reply({ content: 'you already got everything!', ephemeral: true });
            const playerData = await database.Player.findByPk(`${interaction.user.id}`);

            const playerUpgradeLevel = playerData.upgrades[upgradeId] ?? 0;
            const upgradeClass = upgrades[upgradeId];
            const price = upgradeClass.getPrice(playerUpgradeLevel);
            
            if (price > playerData.score) {
                const msg = ['dang!','oops!','awh!','ack!','sad!']

                const button = new ButtonBuilder()
                    .setCustomId('upgrade:delete')
                    .setLabel(msg[Math.floor(Math.random()*msg.length)])
                    .setStyle(ButtonStyle.Secondary)

                await interaction.update(await getEditMessage(interaction, upgradeClass.type())); // fix dropdown remaining after failed upgrade
                return await interaction.followUp({
                    content: `you dont have enough \`pts\` to afford that! (missing \`${price-playerData.score} pts\`)`,
                    components: [new ActionRowBuilder().addComponents(button)]
                })
            }

            playerData.score -= price;
            playerData.upgrades[upgradeId] = playerUpgradeLevel + 1;
            playerData.changed('upgrades', true) // this is a hacky way to set the upgrades field, but it works
            await playerData.save();

            const msg = ['sweet!','nice!','sick!','cool!','neat!','nifty!','yippee!','awesome!'];

            const button = new ButtonBuilder()
                .setCustomId('upgrade:delete')
                .setLabel(msg[Math.floor(Math.random()*msg.length)])
                .setStyle(ButtonStyle.Success)
            
            await interaction.update(await getEditMessage(interaction, upgradeClass.type()));

            return await interaction.followUp({
                content: `upgraded **${upgradeClass.getDetails().name}** to level ${playerUpgradeLevel+1}! you've \`${playerData.score} pts\` left.`,
                components: [new ActionRowBuilder().addComponents(button)]
            })
        })
    }
}

async function getEditMessage(interaction, category) {
    
    const [playerData, _created] = await database.Player.findOrCreate({ where: { userId: interaction.user.id }})
    if (playerData.clicks < 150) {
        const button = new ButtonBuilder()
            .setCustomId('upgrade:delete')
            .setLabel('oh... okay')
            .setStyle(ButtonStyle.Secondary)
        return {
            content: `*upgrades? what upgrades? you should go back to pinging.*\n-# (${playerData.clicks}/150)`,
            components: [new ActionRowBuilder().addComponents(button)]
        }
    }

    const buttonRow = new ActionRowBuilder();
    for (const [_key, cat] of Object.entries(UpgradeTypes)) {
        const button = new ButtonBuilder()
            .setCustomId(`upgrade:category-${cat}`)
            .setLabel(cat)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(category === cat)
        buttonRow.addComponents(button)
    }

    const pUpgrades = playerData.upgrades
    const select = new StringSelectMenuBuilder()
        .setCustomId('upgrade:buy')
        .setPlaceholder('pick an upgrade')
    let description = `you have **__\`${playerData.score} pts\`__** to spend...`
    const embed = new EmbedBuilder()
        .setTitle("upgrades")
        .setColor("#73c9ae")

    for (const [upgradeId, upgrade] of Object.entries(upgrades)) {
        const upgradeLevel = pUpgrades[upgradeId] ?? 0
        if (upgrade.type() != category) continue;
        if (!upgrade.isBuyable({ upgrades: pUpgrades, clicks: playerData.clicks })) continue;
        if (upgrade.getPrice(upgradeLevel) === null) {
            description += `\n**${upgrade.getDetails().emoji} ${upgrade.getDetails().name} (MAX)**\n${upgrade.getDetails().description}\nCurrently ${upgrade.getEffectString(upgradeLevel)}` 
            continue;
        }

        description += `\n**${upgrade.getDetails().emoji} ${upgrade.getDetails().name} (Lv${upgradeLevel})**
${upgrade.getDetails().description}
${upgrade.getEffectString(upgradeLevel)} -> ${upgrade.getEffectString(upgradeLevel+1)} for \`${upgrade.getPrice(upgradeLevel)} pts\`` 

        select.addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel(`${upgrade.getDetails().name} | ${upgrade.getPrice(upgradeLevel)} pts`)
                .setValue(upgradeId)
        )
    }

    if (select.options.length === 0) {
        select.addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel('upgrades are maxed!')
                .setValue('none')
                .setDefault(true)
        )
    }


    embed.setDescription(description)

    return { embeds: [embed], components: [buttonRow, new ActionRowBuilder().addComponents(select)] }
}