const UpgradeTypes = require('../helpers/upgradeEnums.js');

module.exports = {
    getPrice(currentLevel) {
        return 123456 * (currentLevel+1)**3;
    },
    getDetails() {
        return {
            description: "increase \`bp\` storage",
            name: "beyond the limit",
            emoji: "✨",
        }
    },
    getEffectString(level) {
        return `${(level+1)*10000} storage`;
    },
    getEffect(level, context) {
        return {} // nothing; effect is elsewhere
    },
    isBuyable(context) {
        return context.upgrades.pingularity && context.upgrades.stars && context.upgrades.stars >= 1;
    },
    sortOrder() { return 1002 },
    type() { return UpgradeTypes.PRESTIGE }
}