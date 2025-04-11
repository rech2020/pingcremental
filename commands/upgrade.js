const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, EmbedBuilder } = require('discord.js');
const upgrades = require('./../helpers/upgrades.js')
const database = require('./../helpers/database.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('upgrade')
		.setDescription('get stronger pings'),
	async execute(interaction) {
        await interaction.reply(await getEditMessage(interaction));
	},
    buttons: {
        delete: (async interaction => {
            await interaction.update(`(bye!)`);
            await interaction.deleteReply(interaction.message);
        })
    },
    dropdowns: {
        buy: (async interaction => {
            const upgradeId = interaction.values[0];
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

                return await interaction.reply({
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
            
            await interaction.update(await getEditMessage(interaction));

            return await interaction.followUp({
                content: `upgraded **${upgradeClass.getDetails().name}** to level ${playerUpgradeLevel+1}!`,
                components: [new ActionRowBuilder().addComponents(button)]
            })
        })
    }
}

async function getEditMessage(interaction) {
    
    const [playerData, _created] = await database.Player.findOrCreate({ where: { userId: interaction.user.id }})
    if (playerData.clicks < 150) {
        return {
            content: `*upgrades? what upgrades? you should go back to pinging.*\n-# (${playerData.clicks}/150)`,
        }
    }

    const pUpgrades = playerData.upgrades
    const select = new StringSelectMenuBuilder()
        .setCustomId('upgrade:buy')
        .setPlaceholder('pick an upgrade')
    const embed = new EmbedBuilder()
        .setTitle("upgrades")
        .setColor("#73c9ae")
        .setDescription(`you have **__\`${playerData.score} pts\`__** to spend...`)

    for (const [upgradeId, upgrade] of Object.entries(upgrades)) {
        const upgradeLevel = pUpgrades[upgradeId] ?? 0
        if (!upgrade.isBuyable({ upgrades: pUpgrades, clicks: playerData.clicks })) continue;
        if (upgrade.getPrice(upgradeLevel) === null) {
            embed.addFields({ 
                name: `${upgrade.getDetails().name} (MAX)`, 
                value: `${upgrade.getDetails().description}\nCurrently ${upgrade.getEffectString(upgradeLevel)}` 
            })
            continue;
        }

        embed.addFields({ 
            name: `${upgrade.getDetails().name} (Lv${upgradeLevel})`, 
            value: `${upgrade.getDetails().description}
${upgrade.getEffectString(upgradeLevel)} -> ${upgrade.getEffectString(upgradeLevel+1)} for \`${upgrade.getPrice(upgradeLevel)} pts\`` 
        })
        
        select.addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel(`${upgrade.getDetails().name} | ${upgrade.getPrice(upgradeLevel)} pts`)
                .setValue(upgradeId)
        )
    }

    return { embeds: [embed], components: [new ActionRowBuilder().addComponents(select)] }
}