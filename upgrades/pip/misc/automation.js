const { PipUpgradeTypes } = require('../../../helpers/upgradeEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        return Math.round(66 ** (currentLevel / 4) * 2361);
    },
    getDetails() {
        return {
            description: "gain __+2__ APT when finding a blue ping",
            name: "automation",
            emoji: getEmoji('ponder_template', "⚙️"),
            flavor: "all things eventually converge on industry.",
        }
    },
    getEffectString(level) {
        return `${level * 2} APT`;
    },
    getEffect(level, context) {
        if (!context.isSuper) return {};

        return {
            apt: level * 2,
        }
    },
    upgradeRequirements() {
        return { exponentiate: 1 };
    },
    sortOrder() { return 204 },
    type() { return PipUpgradeTypes.MISC }
}