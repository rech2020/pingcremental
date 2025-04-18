const UpgradeTypes = require('../helpers/upgradeEnums.js');

module.exports = {
    getPrice(currentLevel) {
        if (currentLevel >= 3) return null // max 45%
        return 100 * (15**(currentLevel+1))
    },
    getDetails() {
        return {
            description: "__15%__ chance the blue ping will spawn on the left",
            name: "budge",
            emoji: "<:upgrade_budge:1362633785350426634>",
        }
    },
    getEffectString(level) {
        return `${level*15}%`
    },
    getEffect(level, context) {
        return {
            special: Math.random()*100 <= level*15 ? "budge" : undefined
        }
    },
    isBuyable(context) {
        return context.upgrades['blueshift'] && context.upgrades.blueshift > 6;
    },
    sortOrder() { return 15 },
    type() { return UpgradeTypes.BLUE_PING }
}