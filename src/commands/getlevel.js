const { SlashCommandBuilder } = require('discord.js');
const Utils = require('./../utils');

function commandData() {
    return new SlashCommandBuilder()
        .setName("getlevel")
        .setDescription("Get your current level");
}


async function execute(interaction, levelManager) {

    const guildId = interaction.guildId;
    const memberId = interaction.member.id;
    const username = interaction.member.user.username;
    const levelsXp = [0, 600, 1800, 3600, 6000, 9000, 12600, 16800, 21600, 27000, 33000, 39600, 46800, 54600, 63000, 72000, 81600, 91800, 102600, 114000,
         126000, 138600, 151800, 165600, 180000, 195000, 210600, 226800, 243600, 261000, 279000, 297600, 316800, 336600, 357000, 378000, 399600, 421800,
          444600, 468000, 492000, 516600, 541800, 567600, 594000, 621000, 648600, 676800, 705600, 735000, 765000, 795600, 826800, 858600, 891000, 924000,
           957600, 991800, 1026600];

    if (guildId === undefined || guildId === null || guildId === '') {
        return;
    }

    const xp = levelManager.getUserLevel(guildId, memberId);   
    xp.then(async (xp) => {
        const level = Utils.xpToLevel(xp, levelsXp);
    
        const nextLevelXp = Utils.levelToXp(level+1,levelsXp);
        const currentLevelXp = Utils.getXpFromAllLevels(level, levelsXp);
    
        const embed = Utils.toEmbed(`Level ${level}`, `${username}, you have ${xp - currentLevelXp}/${nextLevelXp}xp before reaching the next level`, 0x62ff00);
    
        await interaction.reply({ embeds: [embed] });
        
        console.log(`getlevel.execute (SUCCESS) : Sent level to ${memberId} in guild ${guildId} `);
    })
    .catch((error) => {
        console.error('getlevel.execute (ERROR) : '+error);
    });
}


module.exports = {
    commandData,
    execute
};