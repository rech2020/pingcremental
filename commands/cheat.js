const { SlashCommandBuilder, InteractionContextType, EmbedBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const database = require('./../helpers/database.js');
const { getEmbeddedCommand } = require('./../helpers/embedCommand.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cheat')
        .setDescription('cheat in some stuff. only available in testing')
        .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel),
    async execute(interaction) {
        if (!process.env.TEST_ENV || process.env.TEST_ENV !== 'true') {
            return await interaction.reply({ content: "this command is only available in testing mode! not sure how you accessed this, but you shouldn't.", ephemeral: true });
        }

        await interaction.reply(getCheatEmbed());
    },
    buttons: {
        'reset': async (interaction) => {
            const player = await database.Player.findByPk(interaction.user.id);
            if (!player) {
                return await interaction.update({ content: 'you do not have any data to reset...?', components: [] });
            }

            await player.destroy();

            await interaction.update({ content: 'your data has been reset!', components: [] });
        }
    },
    dropdowns: {
        'select': async (interaction) => {
            const value = interaction.values[0];
            const [player, _created] = await database.Player.findOrCreate({ where: { userId: interaction.user.id } });

            if (value === 'apt') {
                player.apt += 1e5;
            }
            else if (value === 'currency') {
                player.score += 1e30;
                player.pip += 1e6;
                player.thread += 1000;
            } else if (value === 'rerolls') {
                player.fabricShopRerolls = 0;
                player.cloakModificationsAllowed += 5;
            } else if (value === 'reset') {
                const button = new ButtonBuilder()
                    .setCustomId('cheat:reset')
                    .setLabel('i\'m sure, reset!')
                    .setStyle(ButtonStyle.Danger)

                await interaction.update(getCheatEmbed());
                return await interaction.followUp({
                    content: `are you sure you want to reset your data? this will delete all your progress and start you from scratch!`,
                    components: [new ActionRowBuilder().addComponents(button)],
                    flags: MessageFlags.Ephemeral,
                })
            } else if (value === 'profile') {
                const modal = new ModalBuilder()
                    .addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('property')
                                .setLabel('property')
                                .setStyle(TextInputStyle.Short)
                                .setPlaceholder('the property you want to change')
                                .setRequired(true)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('value')
                                .setLabel('value')
                                .setStyle(TextInputStyle.Short)
                                .setPlaceholder('the value you want to set it to (or empty to just view it)')
                                .setRequired(false)
                        )
                    )
                    .setCustomId('cheat:profile')
                    .setTitle('edit profile data')
                
                return await interaction.showModal(modal);
            }

            await player.save();
            await interaction.update(getCheatEmbed());
            await interaction.followUp({ content: `cheat applied!`, ephemeral: true });
        }
    },
    modals: {
        'profile': async (interaction) => {
            const property = interaction.fields.getTextInputValue('property');
            const value = interaction.fields.getTextInputValue('value');
            const [player, _created] = await database.Player.findOrCreate({ where: { userId: interaction.user.id } });

            if (value) {
                player[property] = value;
                await player.save();
                return await interaction.reply({ content: `set \`${property}\` to \`${value}\`!`, ephemeral: true });
            } else {
                return await interaction.reply({ content: `the value of \`${property}\` is \`${player[property]}\`!`, ephemeral: true });
            }
        }
    },
    testingModeOnly: true,
}

function getCheatEmbed() {
    const embed = new EmbedBuilder()
        .setColor('#ff0062')
        .setTitle('cheat options')
        .setDescription(
`welcome to the **cheat menu**! since you're probably using the beta bot, you can use this to cheat in things so you can test things better.
note that this **does not affect the main bot** and is only for testing purposes.
also be warned that this bot **may be unstable**, so please report any bugs ASAP with ${getEmbeddedCommand('feedback submit')}.`);
    
    const select = new StringSelectMenuBuilder()
        .setCustomId('cheat:select')
        .setPlaceholder('pick out a cheat')
        .setMaxValues(1)
        .setMinValues(1)
        .addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel('i want infinite pings!')
                .setValue('apt')
                .setDescription('grants a lot of APT.'),
            new StringSelectMenuOptionBuilder()
                .setLabel('i\'m money hungry!')
                .setValue('currency')
                .setDescription('gives a lot of various currencies (pts, pip, thread).'),
            new StringSelectMenuOptionBuilder()
                .setLabel('give me more rerolls!')
                .setValue('rerolls')
                .setDescription('resets fabric shop rerolls, and gives more cloak modifications.'),
            new StringSelectMenuOptionBuilder()
                .setLabel('i want to start from scratch!')
                .setValue('reset')
                .setDescription('resets your data.'),
            new StringSelectMenuOptionBuilder()
                .setLabel('let me mess with my data!')
                .setValue('profile')
                .setDescription('[ADVANCED] gives direct access to your profile data.')
        )
    
    return {
        embeds: [embed],
        components: [new ActionRowBuilder().addComponents(select)],
        flags: MessageFlags.Ephemeral,
    }
}