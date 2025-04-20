const UpgradeTypes = require('../../../helpers/upgradeEnums.js');

module.exports = {
    getPrice(currentLevel) {
        return currentLevel === 0 ? 1 : null;
    },
    getDetails() {
        return {
            description: "ping remains eternal.",
            name: "Eternity",
            emoji: "✨",
        }
    },
    getEffectString(level) {
        return level === 1 ? "released" : `constrained`
    },
    getEffect(level, context) {
        return {} // nothing; effect is elsewhere
    },
    isBuyable(context) {
        return context.bp >= 10000;
    },
    sortOrder() { return 1003 },
    type() { return UpgradeTypes.PRESTIGE }
}