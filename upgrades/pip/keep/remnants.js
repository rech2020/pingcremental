const { PipUpgradeTypes } = require('../../../helpers/upgradeEnums.js');

module.exports = {
    getPrice(currentLevel) {

    },
    getDetails() {
        return {
            description: "start with __+1__ level of various upgrades",
            name: "Remnants",
            emoji: "✨",
            flavor: "preserve the past as you would the future.",
        }
    },
    getEffectString(level) {
        return `lv${level}`
    },
    getEffect(level, context) {
        return {}
    },
    upgradeRequirements() {
        return { memory: 2 };
    },
    sortOrder() { return 302 },
    type() { return PipUpgradeTypes.KEEP }
}