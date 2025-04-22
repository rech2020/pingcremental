const { PipUpgradeTypes } = require('../../../helpers/upgradeEnums.js');

module.exports = {
    getPrice(currentLevel) {
        return Math.round(357 * (1.75 ** currentLevel)) + 1000;
    },
    getDetails() {
        return {
            description: "gain __+2,500__ max bp",
            name: "Stellar Strength",
            emoji: "✨",
            flavor: "carry the weight of the stars.",
        }
    },
    getEffectString(level) {
        return `+${level*2500}`
    },
    getEffect(level, context) {
        return {}
    },
    upgradeRequirements() {
        return { beginning: 1 };
    },
    sortOrder() { return 401 },
    type() { return PipUpgradeTypes.PRESTIGE }
}