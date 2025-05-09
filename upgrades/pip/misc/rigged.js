const { PipUpgradeTypes } = require('../../../helpers/upgradeEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        return Math.round(100**(1.5*(currentLevel+1)))
    },
    getDetails() {
        return {
            description: "roll __1__ extra d20, take the higher result",
            name: "Loaded Dice",
            emoji: getEmoji('ponder_rigged', "🎲"),
            flavor: "maybe the house doesn't always win.",
        }
    },
    getEffectString(level) {
        return `+${level} d20`;
    },
    getEffect(level, context) {
        return {
            special: {
                "extraDice": level,
            }
        }
    },
    upgradeRequirements() {
        return { beginning: 1 };
    },
    sortOrder() { return 201 },
    type() { return PipUpgradeTypes.MISC }
}