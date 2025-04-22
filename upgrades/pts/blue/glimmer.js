const { UpgradeTypes } = require('../../../helpers/upgradeEnums.js');

module.exports = {
    getPrice(currentLevel) {
        return currentLevel === 0 ? 43234 : null; // 1-time but not in the category because blue takes priority
    },
    getDetails() {
        return {
            description: "after clicking a blue ping, the next 5 pings will give x1.2 pts",
            name: "glimmer",
            emoji: "<:upgrade_glimmer:1362633769491890378>",
        }
    },
    getEffectString(level) {
        return level === 1 ? `x1.2` : `x1`;
    },
    getEffect(level, context) {
        return {
            special: (context.isSuper ? "gainGlimmer" : (context.glimmerClicks ? "glimmer" : null)),
            multiply: context.glimmerClicks && !context.isSuper ? 1.2 : 1,
        }
    },
    isBuyable(context) {
        return context.upgrades.budge && context.upgrades.budge > 1 && context.upgrades.blueshift && context.upgrades.blueshift > 3;
    },
    sortOrder() { return 17 },
    type() { return UpgradeTypes.BLUE_PING }
}