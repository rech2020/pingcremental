const { PipUpgradeTypes } = require('../../../helpers/upgradeEnums.js');

module.exports = {
    getPrice(currentLevel) {

    },
    getDetails() {
        return {
            description: "gain __x1.25__ PIP",
            name: "Telepathy",
            emoji: "✨",
            flavor: "know your thoughts before you even think them.",
        }
    },
    getEffectString(level) {
        return `x${(level*0.25) + 1}`
    },
    getEffect(level, context) {
        return {}
    },
    upgradeRequirements() {
        return { storage: 2 };
    },
    sortOrder() { return 403 },
    type() { return PipUpgradeTypes.PRESTIGE }
}