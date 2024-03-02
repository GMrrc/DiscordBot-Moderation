const { SlashCommandBuilder } = require('discord.js');
const Utils = require('./../utils');


function commandData() {
    return new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("Get the leaderboard of the server")
        .addIntegerOption(option => option.setName('amount').setDescription('The amount of player to return').setRequired(false));
}

async function execute(interaction, levelManager) {
    try {
        const guildId = interaction.guildId;
        const amount = interaction.options.get('amount')?.value || 3;
        const levelsXp = [0, 600, 1800, 3600, 6000, 9000, 12600, 16800, 21600, 27000, 33000, 39600, 46800, 54600, 63000, 72000, 81600, 91800, 102600, 114000,
            126000, 138600, 151800, 165600, 180000, 195000, 210600, 226800, 243600, 261000, 279000, 297600, 316800, 336600, 357000, 378000, 399600, 421800,
             444600, 468000, 492000, 516600, 541800, 567600, 594000, 621000, 648600, 676800, 705600, 735000, 765000, 795600, 826800, 858600, 891000, 924000,
              957600, 991800, 1026600];

        if (!guildId) {
            return;
        }

        if (amount < 1) {
            await interaction.reply({
                content: 'The amount must be at least 1',
                ephemeral: true
            });
            return;
        }

        if (amount > 10) {
            await interaction.reply({
                content: 'The amount must be at most 10',
                ephemeral: true
            });
            return;
        }

        const leaderboard = await levelManager.getTopLevels(guildId, amount);
        
        let texte = '';

        for (const [index, userData] of leaderboard.entries()) {
            const userId = userData[0];
            const userXp = userData[1];
            try {
                const topUser = await interaction.client.users.fetch(userId);
                let username = topUser.username;
                if (username.length > 12) {
                    username = username.substring(0, 12);
                }
                texte += `${(index + 1).toString().padStart(2)} ${username.padEnd(12)} - Level${Utils.xpToLevel(userXp, levelsXp).toString().padStart(2)} - ${userXp.toString()}xp\n`;
            } catch (error) {
                console.error(`leaderboard.execute (ERROR) : Erreur lors de la récupération de l'utilisateur avec l'ID ${userId}:`, error);
                texte += `${(index + 1).toString().padStart(2)} ${userId.toString().padEnd(12)} - Level${Utils.xpToLevel(userXp, levelsXp).toString().padStart(2)} - ${userXp.toString()}xp\n`;
            }
        }

        const monospace = '```';
        const embedText = `${monospace}${texte}${monospace}`;
        
        const embed = Utils.toEmbed(`Leaderboard`, embedText, 0x62ff00);

        await interaction.reply({ embeds: [embed] });

        console.log('leaderboard.execute (SUCCESS) : Leaderboard sent in the guild '+guildId);

    } catch (error) {
        console.error('leaderboard.execute (ERROR) : '+ error);
    }
}





module.exports = {
    commandData,
    execute
};