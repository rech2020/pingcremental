const { PipUpgradeTypes } = require('../../../helpers/upgradeEnums.js');

module.exports = {
    getPrice(currentLevel) {

    },
    getDetails() {
        return {
            description: "gain __+0.3%__ pts for every upgrade removed",
            name: "Vague Memories",
            emoji: "✨",
            flavor: "sometimes all you can remember is that it happened.",
        }
    },
    getEffectString(level) {
        return `+${(level*0.3).toFixed(1)}%`
    },
    getEffect(level, context) {
        return {
            multiply: 1,
        }
    },
    upgradeRequirements() {
        return { memory: 3 };
    },
    sortOrder() { return 303 },
    type() { return PipUpgradeTypes.KEEP }
}