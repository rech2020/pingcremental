const { UpgradeTypes } = require('../../../helpers/upgradeEnums.js');

module.exports = {
    getPrice(currentLevel) {
        return Math.round((currentLevel+1)**4.2);
    },
    getDetails() {
        return {
            description: "gain \`bp\`",
            name: "beyond the stars",
            emoji: "✨",
        }
    },
    getEffectString(level) {
        return `${level*4} bp`
    },
    getEffect(level, context) {
        return {
            bp: level * 4,
        }
    },
    isBuyable(context) {
        return context.upgrades.pingularity;
    },
    sortOrder() { return 1001 },
    type() { return UpgradeTypes.PRESTIGE }
}