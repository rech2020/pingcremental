const UpgradeTypes = require('../helpers/upgradeEnums.js');

module.exports = {
    getPrice(currentLevel) {
        return currentLevel === 0 ? 1000000 : null;
    },
    getDetails() {
        return {
            description: "?",
            name: "pingularity",
            emoji: "<:upgrade_pingularity:1361881430162145451>",
        }
    },
    getEffectString(level) {
        return level === 0 ? "inactive" : "active";
    },
    getEffect(level, context) {
        return {}
    },
    isBuyable(context) {
        return true;
    },
    sortOrder() { return 1000 },
    type() { return UpgradeTypes.ONE_TIME }
}