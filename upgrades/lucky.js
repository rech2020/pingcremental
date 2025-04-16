const UpgradeTypes = require('../helpers/upgradeEnums.js');

module.exports = {
    getPrice(currentLevel) {
        return currentLevel === 0 ? 777 : null;
    },
    getDetails() {
        return {
            description: "get +7 pts when ping ends in 7",
            name: "lucky number 7",
            emoji: "<:upgrade_lucky:1361881365502759013>",
        }
    },
    getEffectString(level) {
        return level === 1 ? "+7" : "+0";
    },
    getEffect(level, context) {
        return {
            add: (context.ping % 10 === 7) ? 7 : undefined,
        }
    },
    isBuyable(context) {
        return Object.keys(context.upgrades).includes('special');
    },
    sortOrder() { return 101 },
    type() { return UpgradeTypes.ONE_TIME }
}