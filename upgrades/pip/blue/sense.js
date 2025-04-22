const { PipUpgradeTypes } = require('../../../helpers/upgradeEnums.js');

module.exports = {
    getPrice(currentLevel) {
        return currentLevel === 0 ? 3566 : null;
    },
    getDetails() {
        return {
            description: "get pinged when a blue ping appears",
            name: "Sixth Sense",
            emoji: "✨",
            flavor: "open your mind to a new world.",
        }
    },
    getEffectString(level) {
        return level === 0 ? `inactive` : "active";
    },
    getEffect(level, context) {
        return {}
    },
    upgradeRequirements() {
        return { beginning: 1 };
    },
    sortOrder() { return 101 },
    type() { return PipUpgradeTypes.BLUE_PING }
}