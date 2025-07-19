const { FabricUpgradeTypes } = require('../../../helpers/upgradeEnums.js');

module.exports = {
    getPrice() {
        return 35;
    },
    getDetails() {
        return {
            description: "grants a flat **x10** multiplier.",
            name: "Gold-Laced Fabric",
            emoji: "🔸",
        }
    },
    getEffect(level, context) {
        return {
            multiply: 10 ** level,
        }
    },
    type() { return FabricUpgradeTypes.FLAT_BONUS },
    isUnique() { return false; }
}