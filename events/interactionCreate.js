const { Events, ButtonStyle, ButtonBuilder, ActionRowBuilder, EmbedBuilder, PermissionsBitField, Embed, MessageFlags, DiscordAPIError } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        try {
            if (interaction.isChatInputCommand() || interaction.isMessageContextMenuCommand()) {
                const command = interaction.client.commands.get(interaction.commandName);

                if (!command) {
                    console.log(`[ERROR] No command matching ${interaction.commandName} was found.`);
                    return;
                }

                
                await command.execute(interaction);
            } else if (interaction.isButton()) {
                if (interaction.message.interaction && interaction.user.id != interaction.message.interaction.user.id) {
                    return await interaction.reply({ content: "this one's not yours?", flags: MessageFlags.Ephemeral })
                }

                const buttonId = interaction.customId
                const split = buttonId.split(':')
                const buttonCommand = interaction.client.commands.get(split[0])

                if (split[1]) {
                    if (!buttonCommand) {
                        console.log(`[ERROR] No command for button ${buttonId} (command ${buttonCommand}) was found.`)
                        return;
                    } else { 
                        await buttonCommand.buttons[split[1].split('-')[0]](interaction, split[1].split('-')[1]); 
                    }
                }
            } else if (interaction.isStringSelectMenu()) {
                if (interaction.user.id != interaction.message.interaction.user.id) {
                    return await interaction.reply({ content: "this one's not yours?", flags: MessageFlags.Ephemeral })
                }

                const dropdownId = interaction.component.customId
                const split = dropdownId.split(':')
                const buttonCommand = interaction.client.commands.get(split[0])

                if (split[1]) {
                    if (!buttonCommand) {
                        console.log(`[ERROR] No command for dropdown ${dropdownId} (command ${buttonCommand}) was found.`)
                        return;
                    } else { 
                        await buttonCommand.dropdowns[split[1].split('-')[0]](interaction, split[1].split('-')[1]); 
                    }
                }
            }
        } catch (error) {
            if (error instanceof DiscordAPIError && error.code == 10062) {
                return console.log(`[INFO] unknown interaction error; thanks, discord`)
            }

            console.error(error)
            const reply = { 
                embeds: [new EmbedBuilder().setTitle("An error occurred!").setDescription(`wuh oh, something broke\n\n${error}`).setColor("ff0000")],
                flags: MessageFlags.Ephemeral
             }
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(reply);
                } else {
                    await interaction.reply(reply);
                }
            } catch {
                console.error("[ERROR] error message sending failed? guh")
            }
        }
    },
};