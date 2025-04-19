const UpgradeTypes = require('../helpers/upgradeEnums.js');

module.exports = {
    getPrice(currentLevel) {
        if (currentLevel >= 5) return null; // max of x1.5
        return Math.round(222 * (13**(currentLevel*1.25)));
    },
    getDetails() {
        return {
            description: "gain __x1.1__ pts for 1 ping, for every __20__ minutes of non-pinging (up to __144__ pings, or 2d inactive)",
            name: "slumber",
            emoji: "<:upgrade_slumber:1362634529545650296>",
        }
    },
    getEffectString(level) {
        return `x${(1+level*0.1).toFixed(1)}, every ${21-level}m, up to ${Math.round((2*24*60)/(21-level))} pings`;
    },
    getEffect(level, context) {
        return {
            multiply: context.slumberClicks ? 1 + (level * 0.1) : 1,
            special: context.slumberClicks ? "slumber" : null,
        }
    },
    isBuyable(context) {
        return context.upgrades.multiplier && context.upgrades.multiplier >= 10;
    },
    sortOrder() { return 107 },
    type() { return UpgradeTypes.MULT_BONUS  }
}