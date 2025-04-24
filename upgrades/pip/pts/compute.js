const { PipUpgradeTypes } = require('../../../helpers/upgradeEnums.js');

module.exports = {
    getPrice(currentLevel) {

    },
    getDetails() {
        return {
            description: "gain __x1.01__ pts per upgrade calculation (*multiplicative*)",
            name: "Computation Completion",
            emoji: "✨",
            flavor: "monotonous tasks like these are more fun with more rewards.",
        }
    },
    getEffectString(level) {
        return `x${(level*0.01) + 1}`
    },
    getEffect(level, context) {
        return {
            multiply: 1,
        }
    },
    upgradeRequirements() {
        return { sacrifice: 2 };
    },
    sortOrder() { return 1000 },
    type() { return PipUpgradeTypes.BONUS }
}