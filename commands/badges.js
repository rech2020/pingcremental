const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, InteractionContextType, MessageFlags, EmbedBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const database = require('./../helpers/database.js');
const { getEmoji } = require('./../helpers/emojis.js')
const { Op } = require('sequelize');
const { getEmbeddedCommand } = require('../helpers/embedCommand.js');
const BADGES_PER_PAGE = 10;
const ownerId = process.env.OWNER_ID;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('badges')
        .setDescription('show off your fancy accomplishments')
        .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel)
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('check someone\'s badges')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('the user to get badges for')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('view all possible badges')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('showcase')
                .setDescription('change which badges you have displayed')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('award')
                .setDescription('grant (or remove) a badge to a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('the user to grant the badge to')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('badge')
                        .setDescription('the badge to grant or remove')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('create a new badge')
        ),
    async execute(interaction) {
        if (interaction.options.getSubcommand() === 'view') {
            const user = interaction.options.getUser('user') || interaction.user;
            const player = await database.Player.findByPk(`${user.id}`);

            if (player.badges.length === 0) {
                return await interaction.reply({ content: `${getEmoji('badge_none_1')} ${user.username} has no badges.`, flags: MessageFlags.Ephemeral });
            }
            
            const badges = await database.Badge.findAll({
                where: { dbId: player.badges },
            });
            let description = `badges of ${await player.getUserDisplay(interaction.client, database)}\n\n`;

            for (const badge of badges) {
                description += `${badgeDisplay(badge)}\n`;
            }

            const embed = new EmbedBuilder()
                .setColor('#e3cf6b')
                .setDescription(description.trim());

            return await interaction.reply({ embeds: [embed] });
        } 
        else if (interaction.options.getSubcommand() === 'list') {
            return await interaction.reply(await getListPage(interaction, 1));
        }
        else if (interaction.options.getSubcommand() === 'showcase') {
            return await interaction.reply(await getShowcaseDisplay(interaction));
        }
        else if (interaction.options.getSubcommand() === 'award') {
            if (interaction.user.id !== ownerId) {
                return await interaction.reply({ content: 'you can\'t do that, you\'re not my owner', flags: MessageFlags.Ephemeral });
            }

            await interaction.deferReply({ ephemeral: true });
            const user = interaction.options.getUser('user');
            const badgeName =interaction.options.getString('badge');

            const player = await database.Player.findByPk(user.id.toString());
            const badge = await database.Badge.findOne({ where: { name: badgeName } });
            let dmMessage = '';
            let playerDisplayedBadges = player.displayedBadges;
            let playerBadges = player.badges; // because sequelize doesn't like it when you try to modify the array directly

            if (playerBadges.includes(badge.dbId.toString())) {
                playerBadges = playerBadges.filter(bId => bId !== badge.dbId.toString());
                playerDisplayedBadges = playerDisplayedBadges.filter(bId => bId !== badge.dbId.toString());

                dmMessage = `**bad news...**\n\nthe badge ${badgeDisplay(badge,true)} was manually removed. \nif you think this was a mistake, stay tuned; your badge will likely be returned soon.`;
            } else {
                playerBadges.push(badge.dbId);

                dmMessage = `**good news!!**\n\nyou have been manually awarded the badge ${badgeDisplay(badge,true)}! be sure to show it off with ${getEmbeddedCommand('badges showcase')}.`;
            }

            player.badges = playerBadges;
            player.displayedBadges = playerDisplayedBadges;
            await player.save();

            const dmablePlayer = await interaction.client.users.resolve(user.id);
            await dmablePlayer.send(dmMessage);

            await interaction.editReply({ content: `successfully ${player.badges.includes(badge.dbId.toString()) ? 'awarded' : 'removed'} the badge ${badgeDisplay(badge,true)} to ${await player.getUserDisplay(interaction.client, database)}` });
        }
        else if (interaction.options.getSubcommand() === 'create') {
            if (interaction.user.id !== ownerId) {
                return await interaction.reply({ content: 'you can\'t do that, you\'re not my owner', flags: MessageFlags.Ephemeral });
            }

            const modal = new ModalBuilder()
                .setCustomId('badges:create')
                .setTitle('creating a new badge...');

            const nameInput = new TextInputBuilder()
                .setCustomId('badgeNameInput')
                .setLabel('name')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);
            const emojiInput = new TextInputBuilder()
                .setCustomId('badgeEmojiInput')
                .setLabel('emoji')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);
            const descriptionInput = new TextInputBuilder()
                .setCustomId('badgeDescriptionInput')
                .setLabel('description')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('how does someone get this badge?')
                .setRequired(true);
            const flavorTextInput = new TextInputBuilder()
                .setCustomId('badgeFlavorTextInput')
                .setLabel('flavor text')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('what\'s the backstory of this badge?')
                .setRequired(true);
            const tierInput = new TextInputBuilder()
                .setCustomId('badgeTierInput')
                .setLabel('tier')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('1 = silver, 2 = blue, 3 = purple')
                .setRequired(true);
            
            modal.addComponents(
                new ActionRowBuilder().addComponents(nameInput),
                new ActionRowBuilder().addComponents(emojiInput),
                new ActionRowBuilder().addComponents(descriptionInput),
                new ActionRowBuilder().addComponents(flavorTextInput),
                new ActionRowBuilder().addComponents(tierInput),
            );
            await interaction.showModal(modal);
        }
    },
    dropdowns: {
        "badgeSelect": async (interaction) => {
            const badgeToToggle = parseInt(interaction.values[0]);
            const playerData = await database.Player.findByPk(`${interaction.user.id}`);
            let displayedBadges = playerData.displayedBadges;

            let followUp = null;
            const okButton = new ButtonBuilder()
                .setCustomId('badges:delete')
                .setLabel('oh... okay')
                .setStyle(ButtonStyle.Secondary);

            if (displayedBadges.includes(badgeToToggle.toString())) {
                displayedBadges = displayedBadges.filter(badgeId => badgeId !== badgeToToggle.toString());
            } else {
                if (displayedBadges.length >= 3) {
                    followUp = "you can only display up to 3 badges! please remove one of your other badges before adding this one.";
                } else {
                    displayedBadges.push(badgeToToggle);
                }
            }

            playerData.displayedBadges = displayedBadges;
            await playerData.save();
            await interaction.update(await getShowcaseDisplay(interaction));
            if (followUp) {
                await interaction.followUp({ content: followUp, components: [new ActionRowBuilder().addComponents(okButton)] });
            }
        }
    },
    buttons: {
        "delete": async (interaction) => {
            await interaction.update({ content: "(bye!)", components: [] });
            await interaction.deleteReply(interaction.message);
        },
        "list": async (interaction, args) => {
            const tier = args.split(',')[0];
            const page = args.split(',')[1] || 1;
            await interaction.update(await getListPage(interaction, parseInt(tier), parseInt(page)));
        }
    },
    modals: {
        "create": async (interaction) => {
            const name = interaction.fields.getTextInputValue('badgeNameInput');
            const emoji = interaction.fields.getTextInputValue('badgeEmojiInput');
            const description = interaction.fields.getTextInputValue('badgeDescriptionInput');
            const flavorText = interaction.fields.getTextInputValue('badgeFlavorTextInput');
            const tier = parseInt(interaction.fields.getTextInputValue('badgeTierInput'));

            const newBadge = await database.Badge.create({
                name,
                emoji,
                description,
                flavorText,
                tier,
            });

            await interaction.reply({ content: `successfully created the badge ${badgeDisplay(newBadge, true)}!`, flags: MessageFlags.Ephemeral });
        }
    },
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getString('badge');
        const badges = await database.Badge.findAll({
            where: {
                name: {
                    [Op.substring]: focusedValue
                }
            },
            limit: 25,
        });

        const options = [];
        for (const badge of badges) {
            options.push({
                name: badge.name,
                value: badge.name,
            });
        }

        await interaction.respond(options);
    }
}

async function getListPage(interaction, tier, page = 1) {
    const badgeCount = await database.Badge.count({
        where: { tier: tier },
    });

    if (page < 1 || isNaN(page)) page = 1;

    let description = `${getEmoji(`badge_none_${tier}`)} __${['silver','blue','purple'][tier-1]} badges__ (${badgeCount} total)\n\n`;

    if (badgeCount === 0) {
        description += `huh. there's nothing here...?`;
    } else {
        const badges = await database.Badge.findAll({
            where: { tier: tier },
            limit: 10,
            offset: (page - 1) * BADGES_PER_PAGE,
        });

        for (const badge of badges) {
            description += `${badgeDisplay(badge)}\n`;
        }
    }

    const embed = new EmbedBuilder()
        .setColor('#d1b586')
        .setDescription(description.trim());

    const tierButtons = [1,2,3].map(t => {
        return new ButtonBuilder()
            .setCustomId(`badges:list-${t},1`) // formatted tier-page
            .setLabel(`${['silver','blue','purple'][t-1]} tier`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(t === tier)
            .setEmoji(getEmoji(`badge_none_${t}`));
    });

    let navRow = undefined;

    // add nav buttons if there's a lot of badges
    if (badgeCount > BADGES_PER_PAGE) {
        const pageCount = Math.ceil(badgeCount / BADGES_PER_PAGE);
        
        const leftButton = new ButtonBuilder()
            .setCustomId(`badges:list-${tier},${page - 1}`)
            .setLabel('<--')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 1);
        if (page - 1 === 1) {
            leftButton.setCustomId(`badges:list-${tier}`) // discord doesn't like duplicate custom ids, so we work around it with this
        }
        
        const rightButton = new ButtonBuilder()
            .setCustomId(`badges:list-${tier},${page + 1}`)
            .setLabel('-->')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page >= pageCount);
        
        navRow = new ActionRowBuilder()
            .addComponents(leftButton, rightButton);
    }

    const tierRow = new ActionRowBuilder().addComponents(tierButtons);

    const rows = [tierRow];
    if (navRow) rows.push(navRow);

    return { embeds: [embed], components: rows };
}

async function getShowcaseDisplay(interaction) {
    const player = await database.Player.findByPk(`${interaction.user.id}`);

    if (!player) {
        return { content: 'you don\'t have a profile yet. try /ping instead of this command', flags: MessageFlags.Ephemeral };
    }

    const displayedBadges = player.displayedBadges;
    const badges = await database.Badge.findAll({
        where: { dbId: player.badges },
    });

    if (badges.length === 0) {
        return { content: `${getEmoji('badge_empty')} you don't have any badges...`, flags: MessageFlags.Ephemeral };
    }

    let description = `choose which badges to display (**${displayedBadges.length}/3**)...\npreview: ${await player.getUserDisplay(interaction.client, database)}\n\n`;

    const dropdown = new StringSelectMenuBuilder()
        .setCustomId('badges:badgeSelect')
        .setPlaceholder('choose a badge to toggle...');

    for (const badge of badges) {
        dropdown.addOptions({
            label: `${badge.name}`,
            value: `${badge.dbId}`,
            // emoji: getEmoji(badge.emoji),
        });
        description += `${badgeDisplay(badge,true)} ${displayedBadges.includes(badge.dbId.toString()) ? '🟢' : ''}\n`;
    }

    const row = new ActionRowBuilder().addComponents(dropdown);

    const embed = new EmbedBuilder()
        .setColor('#6b8fe3')
        .setDescription(description.trim());

    return { embeds: [embed], components: [row] };
}

function badgeDisplay(dbBadge, short = false) {
    if (short) {
        return `${getEmoji(dbBadge.emoji)} ${dbBadge.name}`;
    }

    const display = 
`${getEmoji(dbBadge.emoji)} **${dbBadge.name}**
*"${dbBadge.flavorText}"*
${dbBadge.description}`;

    return display;
}