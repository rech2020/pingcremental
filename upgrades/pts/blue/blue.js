const { UpgradeTypes } = require('../../../helpers/upgradeEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        if (currentLevel === 0) return 1000
        else return null;
    },
    getDetails() {
        return {
            description: "1% chance (35% cap) of spawning a blue ping that grants 15x `pts`",
            name: "blue ping",
            emoji: getEmoji('upgrade_blue', "🟦"),
        }
    },
    getEffectString(level) {
        return level === 0 ? "not discoverable" : "discoverable"
    },
    getEffect(level, context) {
        return {
            special: { "blueping" : true },
            blue: 1,
        };
    },
    isBuyable(context) {
        return true;
    },
    sortOrder() { return 10 },
    type() { return UpgradeTypes.BLUE_PING }
}