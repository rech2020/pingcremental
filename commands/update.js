const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, InteractionContextType, MessageFlags, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const database = require('./../helpers/database.js');
const sequelize = require('sequelize');
const getLatestVersion = require('./../helpers/versions.js');
const ownerId = process.env.OWNER_ID;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('update')
        .setDescription('view and change the bot\'s version')
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('view a changelog for a specific version')
                .addStringOption(option =>
                    option.setName('version')
                        .setDescription('the version to view')
                        .setRequired(false)
                        .setAutocomplete(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('announce')
                .setDescription('officially announce a new version')
        )
        .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel),
    async execute(interaction) {
        if (process.env.TEST_ENV && process.env.TEST_ENV === 'true') {
            return await interaction.reply({ content: "versioning isn't available in beta or testing!", flags: MessageFlags.Ephemeral });
        }

        if (interaction.options.getSubcommand() === 'view') {
            const version = interaction.options.getString('version') || 'latest';
            await interaction.reply(await getVersionMessage(version));
            return;
        } 
        else if (interaction.options.getSubcommand() === 'announce') {
            if (interaction.user.id !== ownerId) {
                await interaction.reply({ content: 'i don\'t think you\'re the right person for the job here, sorry', flags: MessageFlags.Ephemeral });
                return;
            }

            const modal = new ModalBuilder()
                .setCustomId(`update:announce`)
                .setTitle(`announcing a new version...`)
                .addComponents(
                    new ActionRowBuilder()
                        .addComponents(
                            new TextInputBuilder()
                                .setCustomId('description')
                                .setLabel('description of the changes')
                                .setStyle(TextInputStyle.Paragraph)
                                .setRequired(true)
                        ),
                    new ActionRowBuilder()
                        .addComponents(
                            new TextInputBuilder()
                                .setCustomId('importance')
                                .setLabel('importance of the update')
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true)
                                .setPlaceholder('major, minor, patch, hotfix')
                        )
                );
            
            await interaction.showModal(modal);
        }
    },
    async autocomplete(interaction) {
        if (interaction.options.getSubcommand() === 'view') {
            const focusedValue = interaction.options.getFocused();
            const versions = await database.Version.findAll({
                attributes: ['verNum'],
                order: [['releasedAt', 'DESC']],
            });

            if (!versions || versions.length === 0) {
                await interaction.respond([{ name: 'no versions found??', value: 'none' }]);
                return;
            }

            let choices = versions.map(v => v.verNum).filter(v => v.includes(focusedValue));
            if (choices.length > 25) {
                choices = choices.slice(0, 25);
            }

            await interaction.respond(choices.map(choice => ({ name: choice, value: choice })));
        }
    },
    buttons: {
        ver: async (interaction, version) => {
            await interaction.update(await getVersionMessage(version));
        }
    },
    modals: {
        announce: async (interaction) => {
            const description = interaction.fields.getTextInputValue('description');
            const type = interaction.fields.getTextInputValue('importance').toLowerCase();
            if (!['major', 'minor', 'patch', 'hotfix'].includes(type)) {
                await interaction.reply({ content: 'invalid importance type, must be one of: major, minor, patch, hotfix', flags: MessageFlags.Ephemeral });
                return;
            }
            
            const currentVerInfo = getVersionInfo(await getLatestVersion());

            const newVersion = await database.Version.create({
                verNum: setVersionString({
                    major: currentVerInfo.major + (type === 'major' ? 1 : 0),
                    minor: (type === 'major' ? 0 : currentVerInfo.minor + (type === 'minor' ? 1 : 0)),
                    patch: (type === 'major' || type === 'minor' ? 0 : currentVerInfo.patch + (type === 'patch' ? 1 : 0)),
                    hotfix: (type === 'hotfix' ? (currentVerInfo.hotfix !== null ? currentVerInfo.hotfix + 1 : 1) : null),
                }),
                importance: type,
                description: description,
            })

            let allowedSettings = ["always"];
            if (type === 'major') {
                allowedSettings.push("major only", "minor and major only", "everything but hotfixes");
            }
            if (type === 'minor') {
                allowedSettings.push("minor and major only", "everything but hotfixes");
            }
            if (type === 'patch') {
                allowedSettings.push("everything but hotfixes");
            }

            const usersToNotify = await database.Player.findAll({
                where: {
                    settings: {
                        updateNotification: {
                            [sequelize.Op.in]: allowedSettings,
                        }
                    }
                },
                attributes: ['userId'],
            });

            await interaction.reply({ content: `announcing \`v${newVersion.verNum}\` to ${usersToNotify.length} users...`, flags: MessageFlags.Ephemeral });
            let alerts = { success: 0, noUser: 0, dmFailed: 0 };

            await Promise.all(usersToNotify.map(async (user) => {
                const userToDm = await interaction.client.users.fetch(user.userId).catch(() => null);
                if (!userToDm) {
                    alerts.noUser++;
                    return;
                }

                try {
                    await userToDm.send({
                        content: `a new ${type === 'minor' || type === 'major' ? `${type} update` : type} has been released! \`v${newVersion.verNum}\``,
                        embeds: [getVersionEmbed(newVersion)],
                    });
                    alerts.success++;
                } catch (error) {
                    console.log(`[WARN] failed to DM user ${user.userId} about new version:`, error);
                    alerts.dmFailed++;
                }
            }));

            await getLatestVersion(true); // update cached ver because there's a new one

            let reply = `success! announced \`v${newVersion.verNum}\` to ${alerts.success} users`;
            if (alerts.noUser > 0) {
                reply += `\n${alerts.noUser} users could not be found`;
            }
            if (alerts.dmFailed > 0) {
                reply += `\n${alerts.dmFailed} users could not be DMed`;
            }
            await interaction.editReply({ content: reply });
        }
    },
}

function getVersionEmbed(versionData) {
    return new EmbedBuilder()
        .setTitle(`v${versionData.verNum}`)
        .setDescription(versionData.description)
        .setTimestamp(versionData.releasedAt)
        .setColor(versionData.importance === 'major' ? '#2c2cde' : versionData.importance === 'minor' ? '#2c76de' : versionData.importance === 'patch' ? '#5aa4b0' : '#52827c');
}   

async function getVersionMessage(version) {
    let versionData = await database.Version.findOne({
        where: {
            verNum: version,
        }
    });
    if (version === 'latest') {
        versionData = await database.Version.findOne({ order: [['releasedAt', 'DESC']] });
    }

    if (!versionData) {
        return { content: `no changelog found for v\`${version}\` :(`, flags: MessageFlags.Ephemeral };
    }

    const embed = getVersionEmbed(versionData);
    const row = new ActionRowBuilder()

    if (versionData.dbId > 1) {
        const lastVer = await database.Version.findOne({
            where: {
                dbId: versionData.dbId - 1,
            }
        });
        const prevVerButton = new ButtonBuilder()
            .setCustomId(`update:ver-${lastVer.verNum}`)
            .setLabel(`<- ${lastVer.verNum}`)
            .setStyle(ButtonStyle.Secondary);
        row.addComponents(prevVerButton);
    } else {
        const prevVerButton = new ButtonBuilder()
            .setCustomId('update:ver-none')
            .setLabel('<- x.x.x')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true);
        row.addComponents(prevVerButton);
    }
    
    if (versionData.dbId < await database.Version.count()) {
        const nextVer = await database.Version.findOne({
            where: {
                dbId: versionData.dbId + 1,
            }
        });
        const nextVerButton = new ButtonBuilder()
            .setCustomId(`update:ver-${nextVer.verNum}`)
            .setLabel(`${nextVer.verNum} ->`)
            .setStyle(ButtonStyle.Secondary);
        row.addComponents(nextVerButton);
    } else {
        const nextVerButton = new ButtonBuilder()
            .setCustomId('update:ver-none')
            .setLabel('x.x.x ->')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true);
        row.addComponents(nextVerButton);
    }

    return { embeds: [embed], components: [row] };
}

function getVersionInfo(versionString) {
    const versionRegex = /^(\d+)\.(\d+)\.(\d+)(h(\d+))?$/;
    const match = versionString.match(versionRegex);

    if (!match) {
        throw new Error('Invalid version format');
    }

    return {
        major: parseInt(match[1]),
        minor: parseInt(match[2]),
        patch: parseInt(match[3]),
        hotfix: match[4] ? parseInt(match[5]) : null,
    };
}

function setVersionString(versionInfo) {
    let versionString = `${versionInfo.major}.${versionInfo.minor}.${versionInfo.patch}`;
    if (versionInfo.hotfix !== null) {
        versionString += `h${versionInfo.hotfix}`;
    }
    return versionString;
}