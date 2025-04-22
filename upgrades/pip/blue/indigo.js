const { PipUpgradeTypes } = require('../../../helpers/upgradeEnums.js');

module.exports = {
    getPrice(currentLevel) {

    },
    getDetails() {
        return {
            description: "blue pings are __20%__ stronger",
            name: "Indigo Vision",
            emoji: "✨",
            flavor: "an odd form of colorblindness, potentially to your benefit.",
        }
    },
    getEffectString(level) {
        return `+${level*20}%`
    },
    getEffect(level, context) {
        return {
            add: 0,
            multiply: 1,
        }
    },
    upgradeRequirements() {
        return { beginning: 1 };
    },
    sortOrder() { return 102 },
    type() { return PipUpgradeTypes.BLUE_PING }
}