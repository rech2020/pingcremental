const { PipUpgradeTypes } = require('../../../helpers/upgradeEnums.js');

module.exports = {
    getPrice(currentLevel) {

    },
    getDetails() {
        return {
            description: "gain __+0.01%__ pts per PIP held",
            name: "Stardust",
            emoji: "✨",
            flavor: "the stars offer both beauty and utility.",
        }
    },
    getEffectString(level) {
        return `+${level*0.01}% each`
    },
    getEffect(level, context) {
        return {
            multiply: 1 + (context.pip * level * 0.0001),
        }
    },
    upgradeRequirements() {
        return { beginning: 1 };
    },
    sortOrder() { return 402 },
    type() { return PipUpgradeTypes.PRESTIGE }
}