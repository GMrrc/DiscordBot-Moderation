const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const Utils = require('./../utils');


function commandData() {
  return new SlashCommandBuilder()
    .setName("addevent")
    .setDescription("Create an event in the channel")
    .addStringOption(option => option.setName('name').setDescription('The name of the event').setRequired(true))
    .addStringOption(option => option.setName('text').setDescription('Text for the event').setRequired(true))
    .addStringOption(option => option.setName('time').setDescription('Time for the event, mm/dd/hh/mm format').setRequired(true))
    .addStringOption(option => option.setName('role').setDescription('The role to ping for the event').setRequired(true))
    .addIntegerOption(option => option.setName('introduce').setDescription('Time before the event to introduce it').setRequired(false));
}

async function execute(interaction, eventManager) {

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

  const name = interaction.options.get('name').value;
  const texte = interaction.options.get('text').value;
  const time = interaction.options.get('time').value;
  const roleRequest = interaction.options.get('role').value;

  const roleMention = Utils.removeMentionTags(roleRequest);
  const role = interaction.guild.roles.cache.get(roleMention);

  if (!role) {
    await interaction.reply({
      content: 'Role not found!',
      ephemeral: true
    });
    return;
  }

  if (texte === undefined || texte === null) {
    return;
  }

  if (name === undefined || name === null) {
    return;
  }

  if (name.length > 100 || name.length < 0) {
    await interaction.reply({
      content: 'The name is too long (max 100 characters)',
      ephemeral: true
    });
    return;
  }

  if (texte.length > 1800 || texte.length < 0) {
    await interaction.reply({
      content: 'The text is too long (max 1800 characters)',
      ephemeral: true
    });
    return;
  }

  //time is a string like dd/hh/mm, we need to split it to get the hours and minutes and to verify if it's a valid time
  if (time === undefined || time === null || time === '') {
    await interaction.reply({
      content: 'Invalid time format (mm/dd/hh/mm)',
      ephemeral: true
    });
    return;
  }

  const timeSplit = time.split('/');
  let month = parseInt(timeSplit[0]);
  let day = parseInt(timeSplit[1]);
  let hours = parseInt(timeSplit[2]);
  let minutes = parseInt(timeSplit[3]);

  const channel = interaction.channel;

  if (!channel) {
    await interaction.reply({
      content: 'Channel not found!',
      ephemeral: true
    });
    return;
  }
  const eventEmbed = Utils.toEmbed(name, texte, role.color);


  let before = interaction.options.get('introduce')?.value || undefined;

  if (before !== undefined && (before < 1 || before > 60)) {
    await interaction.reply({
      content: 'Invalid repeat delay (1-60)',
      ephemeral: true
    });
    return;
  }

  // Check if the date is valid and if the event can be added

  const isValidDate = await eventManager.checkDate(month, day, hours, minutes);

  if (!isValidDate) {
    await interaction.reply({
      content: 'Invalid date',
      ephemeral: true
    });
    return;
  }

  const eventDate = `${minutes} ${hours} ${day} ${month} *`;
  eventManager.addEvent(channel, name, eventEmbed, roleRequest, eventDate)
    .then( async () => {

      if (before !== undefined) {
        if (before < minutes) {
          minutes -= before;
        } else {
          minutes = 60 - (before - minutes);
          hours--;
          if (hours < 0) {
            hours = 23;
            day--;
            if (day < 1) {
              day = 31;
              month--;
              if (month < 1) {
                month = 12;
              }
            }
          }
        }

        const isValidIntro = await eventManager.checkDate(month, day, hours, minutes)

        if (!isValidIntro) {
          await interaction.reply({
            content: 'Invalid date for the introduction',
            ephemeral: true
          });
          return;
        }

        const eventDateDelayed = `${minutes} ${hours} ${day} ${month} *`;
        const beforeEmbed = Utils.toEmbed(name, `The event will begin in ${before}minutes`, role.color);

        eventManager.addEvent(channel, name, beforeEmbed, roleRequest, eventDateDelayed)
          .catch(error => {
            console.error('addevent.execute (ERROR) : '+error);
            interaction.reply({
              content: 'An error occurred while trying to add the event',
              ephemeral: true
            });
            return;
          });
      }
    })
    .catch(error => {
      console.error('addevent.execute (ERROR) : '+error);
      interaction.reply({
        content: 'An error occurred while trying to add the event',
        ephemeral: true
      });
      return;
    });

  await interaction.reply({
    content: 'Event added!',
    ephemeral: true
  });
}


module.exports = {
  commandData,
  execute
};