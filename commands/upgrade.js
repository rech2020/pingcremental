const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const upgrades = require('./../helpers/upgrades.js')
const database = require('./../helpers/database.js')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('upgrade')
		.setDescription('get stronger pings'),
	async execute(interaction) {
        const [playerData, _created] = await database.findOrCreate({ where: { userId: interaction.user.id }})
        if (playerData.clicks < 350) {
            return await interaction.reply({
                content: `*upgrades? what upgrades? you should go back to pinging.*\n-# (${playerData.clicks}/350)`,
            })
        }

        const pUpgrades = playerData.upgrades
        const select = new StringSelectMenuBuilder()
            .setCustomId('upgrade:buy')
            .setPlaceholder('pick an upgrade')
        let description = "";

        for (const [upgradeId, upgrade] of Object.entries(upgrades)) {
            const upgradeLevel = pUpgrades[upgradeId]
            if (!upgrade.isBuyable(pUpgrades)) continue;
            if (upgrade.getPrice(upgradeLevel) === null) {
                description += 
`__**${upgrade.getDetails().name}**__ ${upgrade.getDetails().description} (**MAX**)
__${upgrade.getEffectString(upgradeLevel)}__
`
                continue;
            }

            description += 
`
__**${upgrade.getDetails().name}**__ ${upgrade.getDetails().description} (Lv**${upgradeLevel}**)
__${upgrade.getEffectString(upgradeLevel)}__ -> __${upgrade.getEffectString(upgradeLevel+1)}__ for \`${upgrade.getPrice(upgradeLevel)} pts\``
            
            select.addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel(`${upgrade.getDetails().name} | ${upgrade.getPrice(upgradeLevel)} pts`)
                    .setValue(upgradeId)
            )
        }

        await interaction.reply({
            content: description,
            components: [new ActionRowBuilder.addComponents(select)]
        })
	},
    buttons: {
        delete: (async interaction => {
            await interaction.update(`(bye!)`)
            await interaction.message.delete();
        })
    },
    dropdowns: {
        buy: (async interaction => {
            const upgradeId = interaction.customId;
            const playerData = await database.findByPk(interaction.user.id);

            const playerUpgradeLevel = playerData.upgrades[upgradeId] ?? 0;
            const upgradeClass = upgrades[upgradeId];
            const price = upgradeClass.getPrice(playerUpgradeLevel);
            
            if (price < playerData.score) {
                const msg = ['dang!','oops!','awh!','ack!','sad!']

                const button = new ButtonBuilder()
                    .setCustomId('upgrade:delete')
                    .setLabel(msg[Math.floor(Math.random()*msg.length)])
                    .setStyle(ButtonStyle.Secondary)

                return await interaction.reply({
                    content: `you dont have enough \`pts\` to afford that! (missing \`${price-playerData.score} pts\`)`,
                    components: [new ActionRowBuilder().addComponents(button)]
                })
            }

            playerData.score -= price;
            playerData.upgrades[upgradeId] = playerUpgradeLevel + 1;
            await playerData.save();

            const msg = ['sweet!','nice!','sick!','cool!','neat!','nifty!','yippee!','awesome!'];

            const button = new ButtonBuilder()
                .setCustomId('upgrade:delete')
                .setLabel(msg[Math.floor(Math.random()*msg.length)])
                .setStyle(ButtonStyle.Success)
            
            return await interaction.reply({
                content: `upgraded ${upgradeClass.getDetails().name} to level ${playerUpgradeLevel+1}!`,
                components: [new ActionRowBuilder().addComponents(button)]
            })
        })
    }
}