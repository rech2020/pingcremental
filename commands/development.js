const { SlashCommandBuilder, MessageFlags, InteractionContextType } = require('discord.js');
const { ownerId } = require('./../config.json');
const database = require('./../helpers/database.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('development')
        .setDescription('util commands for development and testing')
        .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel)
        .addSubcommand(subcommand =>
            subcommand
                .setName('restart')
                .setDescription('restart the bot')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('pull')
                .setDescription('pull the latest changes from the repository')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('execute')
                .setDescription('run the javascript code in the input')
                .addStringOption(option =>
                    option.setName('code')
                        .setDescription('code to run')
                        .setRequired(true)
                )
        ),
    async execute(interaction) {
        if (interaction.user.id !== ownerId) {
            return await interaction.reply({ content: 'you can\'t do that, you\'re not my owner', flags: MessageFlags.Ephemeral });
        }

        if (interaction.options.getSubcommand() === 'restart') {
            await interaction.reply({ content: 'restarting...', flags: MessageFlags.Ephemeral });
            process.exit(0);
        } else if (interaction.options.getSubcommand() === 'pull') {
            await interaction.reply({ content: 'pulling latest changes...', flags: MessageFlags.Ephemeral });
            const { exec } = require('child_process');
            exec('git pull', (error, stdout, stderr) => {
                if (error) {
                    interaction.editReply(`exec error: ${error}`);
                    return;
                }
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);
                interaction.editReply(`done!\nstdout: ${stdout}\nstderr: ${stderr}`);
            });
        } else if (interaction.options.getSubcommand() === 'execute') {
            const code = interaction.options.getString('code');
            let result;
            try {
                await interaction.reply({ content: 'running code...', flags: MessageFlags.Ephemeral });
                result = await eval(`async (params) => { ${code} }`)({ database, interaction });
                if (result instanceof Promise) {
                    result = await result;
                }
            } catch (error) {
                return await interaction.editReply({ content: `error happened D: | ${error}`, flags: MessageFlags.Ephemeral });
            }
            if (typeof result === 'object') {
                result = JSON.stringify(result, null, 2);
            } else if (typeof result === 'string') {
                result = result.replace(/`/g, '\\`');
            }
            await interaction.editReply({ content: `done! \`\`\`js\n${result}\n\`\`\``, flags: MessageFlags.Ephemeral });
        }
    }
}