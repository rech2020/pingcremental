const { PipUpgradeTypes } = require('../../../helpers/upgradeEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        return currentLevel === 0 ? 8114 : null;
    },
    getDetails() {
        return {
            description: 'budge deletes "ping again" instead of moving it',
            name: "Bully",
            emoji: getEmoji('upgrade_bully'),
            flavor: "a sacrifice of one for the benefit of... also one.",
        }
    },
    getEffectString(level) {
        return level === 0 ? "move" : "delete"
    },
    getEffect(level, context) {
        return {
            special: { "bully": context.spawnedSuper },
        }
    },
    upgradeRequirements() {
        return { sense: 1 };
    },
    sortOrder() { return 103 },
    type() { return PipUpgradeTypes.BLUE_PING }
}