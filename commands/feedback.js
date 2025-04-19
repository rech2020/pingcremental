const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, InteractionContextType, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const database = require('./../helpers/database.js')
const feedbackCategories = [
    'bug',
    'upgrade',
    'balancing',
    'other'
]

module.exports = {
    data: new SlashCommandBuilder()
        .setName('feedback')
        .setDescription('give or see feedback for the bot')
        .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel)
        .addSubcommand(subcommand =>
            subcommand
                .setName('submit')
                .setDescription('submit feedback for the bot')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('the type of feedback')
                        .setRequired(true)
                        .addChoices(
                            { name: 'report bug', value: 'bug' },
                            { name: 'new upgrade', value: 'upgrade' },
                            { name: 'balancing change', value: 'balancing' },
                            { name: 'other/misc', value: 'other' }
                        )
                )
                .addStringOption(option =>
                    option.setName('feedback')
                        .setDescription('your feedback')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('view and modify recieved feedback')
        ),
    async execute(interaction) {
        if (interaction.options.getSubcommand() === 'submit') {
            if (await database.Feedback.count({ where: { userId: interaction.user.id } }) >= 5) {
                return await interaction.reply({ content: 'you have already submitted 5 feedbacks! please wait until they are reviewed before submitting more, or remove them from the queue yourself.', flags: MessageFlags.Ephemeral });
            }

            const feedbackType = interaction.options.getString('type');
            const feedbackText = interaction.options.getString('feedback');
            const userId = interaction.user.id;

            await database.Feedback.create({ userId, type: feedbackType, text: feedbackText });
            await interaction.reply({ content: `success! thanks for the feedback.`, flags: MessageFlags.Ephemeral });
        } 
        else if (interaction.options.getSubcommand() === 'view') {
            await interaction.reply(await generateFeedbackResponse(interaction, feedbackCategories[0]));
        }
    },
    buttons: {
        "category": (async (interaction, newCategory) => {
            await interaction.update(await generateFeedbackResponse(interaction, newCategory), { flags: MessageFlags.Ephemeral });
        })
    },
    dropdowns: {
        "delete": (async (interaction) => {
            const feedbackId = interaction.values[0];
            if (feedbackId === 'none') return await interaction.reply({ content: 'you didn\'t select anything? how did you manage that?', ephemeral: true });
            const feedback = await database.Feedback.findByPk(feedbackId);

            if (!feedback) return await interaction.reply({ content: 'this one doesn\'t even exist? how?', ephemeral: true });
            if (feedback.userId !== interaction.user.id && interaction.user.id !== '696806601771974707') return await interaction.reply({ content: 'you don\'t have permission to delete this...', ephemeral: true });
            
            await feedback.destroy();
            await interaction.update(await generateFeedbackResponse(interaction, feedback.type));
            await interaction.followUp({ content: `deleted successfully.`, flags: MessageFlags.Ephemeral });
        })
    },
}

async function generateFeedbackResponse(interaction, category) {
    const feedbacks = await database.Feedback.findAll({
        where: { type: category },
        order: [['createdAt', 'DESC']]
    });

    const buttons = [];
    for (const cat of feedbackCategories) {
        buttons.push(
            new ButtonBuilder()
                .setCustomId(`feedback:category-${cat}`)
                .setLabel(`${cat} (${await database.Feedback.count({ where: { type: cat } })})`)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(cat === category)
        )
    }

    const row = new ActionRowBuilder()
        .addComponents(buttons);
    const dropdown = new StringSelectMenuBuilder()
        .setCustomId('feedback:delete')
        .setPlaceholder('pick feedback to delete')

    let description = `__${feedbacks.length}__ for category __${category}__\n`;

    for (const feedback of feedbacks) {
        const user = await interaction.client.users.fetch(feedback.userId);
        description += `\n- __${user.username}__: ${feedback.text}`;
        dropdown.addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel(feedback.text)
                .setValue(`${feedback.dbId}`)
        )
    }

    if (dropdown.options.length === 0) {
        dropdown.addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel('no feedback here :(')
                .setValue('none')
                .setDefault(true)
        )
        description = `__no feedback here.__`;
    }

    const embed = new EmbedBuilder()
        .setTitle("feedback")
        .setColor('#997565')
        .setDescription(description)

    return {
        embeds: [embed],
        components: [row, new ActionRowBuilder().addComponents(dropdown)]
    }
}