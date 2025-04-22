const { PipUpgradeTypes } = require('../../../helpers/upgradeEnums.js');

module.exports = {
    getPrice(currentLevel) {

    },
    getDetails() {
        return {
            description: "gain __^1.05__ pts",
            name: "Exponentiate",
            emoji: "✨",
            flavor: "they only way out is up.",
        }
    },
    getEffectString(level) {
        return `^${((level*0.05)+1).toFixed(2)}`
    },
    getEffect(level, context) {
        return {
            add: 0,
            multiply: 1,
        }
    },
    upgradeRequirements() {
        return { sacrifice: 2 };
    },
    sortOrder() { return 3 },
    type() { return PipUpgradeTypes.BONUS }
}