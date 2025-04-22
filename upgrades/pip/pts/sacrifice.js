const { PipUpgradeTypes } = require('../../../helpers/upgradeEnums.js');

module.exports = {
    getPrice(currentLevel) {
        if (currentLevel === 6) return null;
    },
    getDetails() {
        return {
            description: "__-25__ pts but __x2.5__ pts",
            name: "Sacrifice Simplicity",
            emoji: "✨",
            flavor: "the best of progress inevitably becomes complex.",
        }
    },
    getEffectString(level) {
        return level === 0 ? `-0, x1.0` : `${level-26}, x${((level*1.5) + 1).toFixed(1)}`;
    },
    getEffect(level, context) {
        return {
            add: level-26,
            multiply: (level*1.5) + 1,
        }
    },
    upgradeRequirements() {
        return { beginning: 1 };
    },
    sortOrder() { return 2 },
    type() { return PipUpgradeTypes.BONUS }
}