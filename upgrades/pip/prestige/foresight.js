const { PipUpgradeTypes } = require('../../../helpers/upgradeEnums.js');

module.exports = {
    getPrice(currentLevel) {
        if (currentLevel >= 3) return null;
        return 8.5**(currentLevel+1) * 325;
    },
    getDetails() {
        return {
            description: "start gaining `bp` before unlocking pingularity",
            name: "Foresight",
            emoji: "✨",
            flavor: "know before you go.",
        }
    },
    getEffectString(level) {
        return `+${level*0.2} bp`
    },
    getEffect(level, context) {
        return {
            bp: level*0.2
        }
    },
    upgradeRequirements() {
        return { upgrade: 1 };
    },
    sortOrder() { return 405 }, // upgrade IS found (i'm not using 404 to spite you)
    type() { return PipUpgradeTypes.MISC }
}