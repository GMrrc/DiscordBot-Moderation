class Utils {

    /**
     * Remove mention tags from a string
     * @param {string} input
     * @returns {string}
     */
    static removeMentionTags(input) {
        return input.replace(/<@!?&?(\d+)>/g, '$1');
    }

    /**
     * Compare two strings to see if they are similar 
     * @param {string} input
     * @param {string} input
     * @returns {boolean}
     */
    static isSimilar(str1, str2) {
        if (str1.length !== str2.length) {
            return false;
        }

        const minLength = Math.min(str1.length, str2.length);
        const requiredMatchCount = Math.ceil(minLength * 0.9);

        let matchCount = 0;
        const charMap = {};

        for (let char of str1) {
            charMap[char] = (charMap[char] || 0) + 1;
        }

        for (let char of str2) {
            if (charMap[char] > 0) {
                matchCount++;
                charMap[char]--;
            }
        }

        return matchCount >= requiredMatchCount;
    }


    /**
     * Create a message embed
     * @param {string} input
     * @returns {string}
     */
    static toEmbed(title, description, color) {

        if (color === undefined || color === null || color === '') {
            color = 0x0099ff;
        }

        if (description === undefined || description === null) {
            description = '';
        }

        if (title === undefined || title === null) {
            title = '';
        }

        return {
            color: color,
            title: title,
            description: description
        };
    }

     /**
     * Create a message embed
     * @param {string} input
     * @returns {string}
     */
     static toEmbed(title, description, color, imageUrl) {

        if (color === undefined || color === null || color === '') {
            color = 0x0099ff;
        }

        if (description === undefined || description === null) {
            description = '';
        }

        if (title === undefined || title === null) {
            title = '';
        }

        if (imageUrl === undefined || imageUrl === null) {
            imageUrl = '';
        }


        return {
            color: color,
            title: title,
            description: description,
            image: { url: imageUrl }
        };
    }

    /**
     * Check each level with the getXpFromAllLevels function and find the level where the player's XP is greater than the total XP.
     * @param {number} xp - The player's XP.
     * @param {number[]} levelsXp - The array of XP required for each level.
     * @returns {number} - The level where the player's XP is greater than the total XP.
     */
    static xpToLevel(xp, levelsXp) {
        let totalXp = 0;
        let i = 0;
        while (i < levelsXp.length && xp > totalXp) {
            totalXp += levelsXp[i];
            i++;
        }
        return i-1;
    }
    

    /**
     * Retourne l'expérience nécessaire pour atteindre un certain niveau.
     * @param {number} level - Le niveau de l'utilisateur.
     * @returns {number} - L'expérience nécessaire.
     */
    static levelToXp(level, levelsXp) {
        return levelsXp[level];
    }

    /**
     * Ajoute l'expérience de chaque niveau pour obtenir l'expérience totale.
     * @param {number} levels - Les niveaux de l'utilisateur.
     * @returns {number} - L'expérience totale.
     */
    static getXpFromAllLevels(levels, levelsXp) {
        
        let totalXp = 0;
        for (let i = 0; i < levels; i++) {
            totalXp += levelsXp[i];
        }
        return totalXp;
    }
    
}

module.exports = Utils;
