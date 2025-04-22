const { PipUpgradeTypes } = require('../../../helpers/upgradeEnums.js');

module.exports = {
    getPrice(currentLevel) {

    },
    getDetails() {
        return {
            description: "RNG events like rare pings are __x1.5__ as likely to occur",
            name: "Glamour",
            emoji: "✨",
            flavor: "flaunting, glimmering wealth.",
        }
    },
    getEffectString(level) {
        return `x${((level*0.5)+1).toFixed(1)}`
    },
    getEffect(level, context) {
        return {}
    },
    upgradeRequirements() {
        return { rigged: 1 };
    },
    sortOrder() { return 202 }, // NO WAY CELESTE REFERNECE!?!?/
    type() { return PipUpgradeTypes.MISC }
}