const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const schedule = require('node-schedule');
const Utils = require('./../utils');


function commandData() {
    return new SlashCommandBuilder()
        .setName("temprole")
        .setDescription("Grant temporary access to a user to a specific role")
        .addStringOption(option => option.setName('user').setDescription('The user to grant the role').setRequired(true))
        .addStringOption(option => option.setName('role').setDescription('The role to grant').setRequired(true))
        .addStringOption(option => option.setName('time').setDescription('The time to grant the role').setRequired(true));
}

async function execute(interaction) {
    
    const guildId = interaction.guildId;
    const member = interaction.member;

    if (member === undefined || member === null || member === '') {
        return;
    }

    let manageRole = false;
    manageRole = member.permissions.has(PermissionsBitField.Flags.ManageRoles);

    if (!manageRole) {
        await interaction.reply({
            content: 'You do not have the permission to use this command',
            ephemeral: true
        });
        return;
    }

    const userRequestRaw = interaction.options.get('user').value;
    const roleRequestRaw = interaction.options.get('role').value;
    const timeRequest = interaction.options.get('time').value;

    const userRequest = Utils.removeMentionTags(userRequestRaw);
    const roleRequest = Utils.removeMentionTags(roleRequestRaw);

    if (timeRequest < 1) {
        await interaction.reply({
            content: 'You cannot grant access for less than 1 minute',
            ephemeral: true
        });
        return;
    }

    if (timeRequest > 720) {
        await interaction.reply({
            content: 'You cannot grant access for more than 720 minutes (12 hours)',
            ephemeral: true
        });
        return;
    }

    const roleMember = interaction.guild.members.cache.get(userRequest);
    if (!roleMember) {
        await interaction.reply({
            content: 'User not found',
            ephemeral: true
        });
        return;
    }

    const role = interaction.guild.roles.cache.get(roleRequest);
    if (!role) {
        await interaction.reply({
            content: 'Role not found',
            ephemeral: true
        });
        return;
    }

    const botHighestRole = interaction.guild.members.resolve(interaction.client.user).roles.highest;
    if (!botHighestRole) {
        await interaction.reply({
            content: 'An error occurred while getting the bot\'s highest role',
            ephemeral: true
        });
        return;
    }


    // Check if the user already has the role, or if the role is higher than the bot's highest role
    if (roleMember.roles.cache.has(role.id)) {
        await interaction.reply({
            content: 'User already has the role',
            ephemeral: true
        });
        return;
    } else if (role.comparePositionTo(botHighestRole) >= 0) {
        await interaction.reply({
            content: 'Role is higher than the bot\'s highest role',
            ephemeral: true
        });
        return;
    } else {
        roleMember.roles.add(role)
            .then(() => {

                const userMention = `<@${roleMember.id}>`;
                const roleMention = `<@&${role.id}>`;

                interaction.reply(`Role ${roleMention} granted to user ${userMention} for ${timeRequest} minutes`);
                console.log(`temprole.execute (SUCCESS) : Role "${role.name}" granted to user "${roleMember.user.id}" for ${timeRequest} minutes on guild ${guildId}`);

                let date = new Date();
                date = date.getTime() + timeRequest * 1000 * 60;

                const job = schedule.scheduleJob(date, function () {
                    roleMember.roles.remove(role)
                        .then(() => {
                            console.log(`temprole.sheduleJob (SUCCESS) : Role "${role.name}" removed from user "${roleMember.user.id}" on guild ${guildId}`);
                        })
                        .catch(error => {
                            console.error('temprole.execute (ERROR) : '+error);
                        });
                });
            })
            .catch(error => {
                console.error('temprole.execute (ERROR) : '+error);
                interaction.reply({
                    content: 'An error occurred while granting the role to the user',
                    ephemeral: true
                });
            });
    }

}


module.exports = {
    commandData,
    execute
};