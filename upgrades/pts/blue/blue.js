const { UpgradeTypes } = require('../../../helpers/upgradeEnums.js');

module.exports = {
    getPrice(currentLevel) {
        if (currentLevel === 0) return 1000
        else return null;
    },
    getDetails() {
        return {
            description: "1% chance of spawning a blue ping for 15x pts",
            name: "blue ping",
            emoji: "<:upgrade_blue:1361881310544527542>",
        }
    },
    getEffectString(level) {
        return level === 0 ? "0% chance" : "1% chance"
    },
    getEffect(level, context) {
        return {
            special: { "blueping" : true },
        };
    },
    isBuyable(context) {
        return true;
    },
    sortOrder() { return 10 },
    type() { return UpgradeTypes.BLUE_PING }
}