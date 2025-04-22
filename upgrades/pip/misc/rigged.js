const { PipUpgradeTypes } = require('../../../helpers/upgradeEnums.js');

module.exports = {
    getPrice(currentLevel) {
        return Math.round(100**(1.5*(currentLevel+1)))
    },
    getDetails() {
        return {
            description: "roll __1__ extra d20, take the higher result",
            name: "Loaded Dice",
            emoji: "✨",
            flavor: "maybe the house doesn't always win.",
        }
    },
    getEffectString(level) {
        return `+${level} d20`;
    },
    getEffect(level, context) {
        return {}
    },
    upgradeRequirements() {
        return { beginning: 1 };
    },
    sortOrder() { return 201 },
    type() { return PipUpgradeTypes.MISC }
}