const { UpgradeTypes } = require('../../../helpers/upgradeEnums.js');

module.exports = {
    getPrice(currentLevel) {
        return currentLevel === 0 ? 8125 : null
    },
    getDetails() {
        return {
            description: "gain x0.85 to x1.25 pts, or x0.7 to x1.5 if you roll a 1 or 20",
            name: "actually roll a d20",
            emoji: "<:upgrade_d20:1362633760415285358>",
        }
    },  
    getEffectString(level) {
        return level === 1 ? "d20" : "d0"
    },
    getEffect(level, context) {
        const roll = Math.floor(Math.random() * 20) + 1;
        let mult = (roll/50) + 0.85;

        if (roll === 1) mult = 0.7;
        if (roll === 20) mult = 1.5;

        return {
            multiply: mult,
        }
    },
    isBuyable(context) {
        return context.upgrades.lucky && context.clicks > 500;
    },
    sortOrder() { return 103 },
    type() { return UpgradeTypes.ONE_TIME }
}