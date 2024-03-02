//imports
const { Client, Events, Collection, GatewayIntentBits } = require('discord.js');
const schedule = require('node-schedule');
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');

const GuildBanwordManager = require('./guildBanwordManager');
const UserSpamManager = require('./userSpamManager');
const EventManager = require('./eventManager');
const GuildLevelManager = require('./guildLevelManager');

const Utils = require('./utils');

// declare variables
let cronResetSpam = null;

const banwordManager = new GuildBanwordManager();
const userSpamManager = new UserSpamManager();
const eventManager = new EventManager();
const guildLevelManager = new GuildLevelManager();


const spamEmbed = Utils.toEmbed('Spam', 'You are spamming. Your message has been deleted.', 0xff0000);
const banEmbed = Utils.toEmbed('Banned Word', 'Your message has been deleted because it contained a banned word.', 0xff0000);

// Create a new Discord client with specified intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration
  ]
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));


for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  if ('commandData' in command && 'execute' in command) {
    client.commands.set(command.commandData().name, command);
  } else {
    console.log(`Command file ${file} does not export the required properties`);
  }
}


// -------------------------------------------------------------------------------------------------------------------------------------------------------------

// Here custom functions are defined

/**
 * Reset the spam iteration every minute
 */
function resetSpamIteration() {
  if (cronResetSpam !== null) {
    return;
  }

  cronResetSpam = schedule.scheduleJob('*/1 * * * *', function () {
    if (userSpamManager === undefined) {
      return;
    }
    userSpamManager.resetSpamIteration();
  });
}


// -------------------------------------------------------------------------------------------------------------------------------------------------------------

// Event handler when the bot is ready
client.on('ready', () => {
  console.log(`core.ready (SUCCESS) : Logged in as ${client.user.tag}!`);
  resetSpamIteration();
});

// -------------------------------------------------------------------------------------------------------------------------------------------------------------

// Event handler when the bot receives a message
client.on(Events.MessageCreate, async (message) => {

  if (!message.guild) {
    return;
  }

  if (message.author.bot) {
    return;
  }


  try {
    const guildId = message.guild.id;
    const userId = message.author.id;

    const isDelete = userSpamManager.addSpamIteration(userId, guildId);
    if (isDelete) {

      await message.delete();

      const sendMessage = userSpamManager.checkSpamIteration(userId);

      if (!sendMessage) {
        await message.author.send({ embeds: [spamEmbed] });
      }

      console.log(`core.MessageCreate (SPAM_TRIGGER_SUCCESS) : deleted message from ${message.author.id} on guild ${message.guild.id}`);
    }
  } catch (error) {
    console.error('core.MessafeCreate (SPAM_TRIGGER_ERROR) : ', error);
  }

  try {
    const guildId = message.guild.id;
    const banwords = banwordManager.getBanwords(guildId) || [];
    const messageContent = message.content.toLowerCase();
    const modifiedContent = messageContent.replace(/[\s\-_\.:;/<>&*.]/g, '');

    const banned = banwords.some(word => modifiedContent.includes(word.toLowerCase()));

    if (banned) {
      await message.delete();

      await message.author.send({ embeds: [banEmbed] });

      console.log(`core.MessageCreate (BAN_TRIGGER_SUCCESS) - deleted message from ${message.author.id} on guild ${message.guild.id}`);
    }
  } catch (error) {
    console.error('core.MessageCreate (BAN_TRIGGER_ERROR) : ', error);
  }

  try {

    const guildId = message.guild.id;
    const userId = message.author.id;

    const isSpam = userSpamManager.checkSpam(userId, guildId);

    if (isSpam) {
      return;
    }

    const messagelentgth = message.content.length;
    const xp = messagelentgth + 10;

    guildLevelManager.addUserLevel(guildId, message.author.id, xp);

  } catch (error) {
    console.error('core.MessageCreate (LEVEL_ADD_ERROR) : ', error);
  }

});

// -------------------------------------------------------------------------------------------------------------------------------------------------------------

// Event handler when the bot receives a message update
client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
  try {

    if (!newMessage.guild) {
      return;
    }

    if (newMessage.author.bot) {
      return;
    }

    const guildId = newMessage.guild.id;
    const banwords = banwordManager.getBanwords(guildId) || [];
    const newMessageContent = newMessage.content.toLowerCase();
    const modifiedContent = newMessageContent.replace(/[\s\-_\.:;/<>&*.]/g, '');

    const banned = banwords.some(word => modifiedContent.includes(word.toLowerCase()));

    if (banned) {

      await newMessage.delete();
      await newMessage.author.send({ embeds: [banEmbed] });

      console.log(`core.MessageUpdate (BAN_TRIGGER_SUCCESS) : deleted message from ${newMessage.author.username} on guild ${newMessage.guild.id}`);
    }
  } catch (error) {
    console.error('core.MessageUpdate (BAN_TRIGGER_ERROR) : ', error);
  }
});

// -------------------------------------------------------------------------------------------------------------------------------------------------------------

// Event handler when the player reacts to a message
client.on(Events.MessageReactionAdd, async (reaction, user) => {
  try {
    if (!reaction.message.guild) {
      return;
    }

    const guildId = reaction.message.guild.id;
    //the user who reacted
    const reactMember = reaction.message.guild.members.cache.get(user.id);
    //the user who sent the message
    const messageMember = reaction.message.guild.members.cache.get(reaction.message.author.id);

    guildLevelManager.addUserLevel(guildId, reactMember.id, 14);
    guildLevelManager.addUserLevel(guildId, messageMember.id, 7);

  } catch (error) {
    console.error('Error while handling reaction:', error);
  }
});



// -------------------------------------------------------------------------------------------------------------------------------------------------------------

client.on(Events.InteractionCreate, async (interaction) => {

  if (!interaction.guild) {
    return;
  }

  const commandName = interaction.commandName;
  const command = interaction.client.commands.get(commandName);

  if (!command) {
    return;
  }

  const commandHandlers = {
    'banlist': banwordManager,
    'banword': banwordManager,
    'unbanword': banwordManager,
    'spamlimit': userSpamManager,
    'addevent': eventManager,
    'removeevent': eventManager,
    'getlevel': guildLevelManager,
    'leaderboard': guildLevelManager,
  };

  try {
    if (interaction.isCommand() && command.execute) {
      const handler = commandHandlers[commandName];
      if (handler) {
        await command.execute(interaction, handler);
      } else {
        await command.execute(interaction);
      }
    }
  } catch (error) {
    console.error('core.execute (ERROR) : ', error);
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: 'There was an error while executing this command!',
          ephemeral: true
        });
      } else if (interaction.replied) {
        await interaction.followUp({
          content: 'An additional error occurred while processing!',
          ephemeral: true
        });
      }
    } catch (followUpError) {
      console.error('core.follow (ERROR) : ', followUpError);
    }
  }
});

// -------------------------------------------------------------------------------------------------------------------------------------------------------------

// Log in with the bot's token
client.login(process.env.TOKEN);

