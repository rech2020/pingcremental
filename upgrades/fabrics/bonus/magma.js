const { FabricUpgradeTypes } = require('../../../helpers/upgradeEnums.js');

module.exports = {
    getPrice() {
        return 42;
    },
    getDetails() {
        return {
            description: "grants a **^1.25** bonus after a **x0.4** debuff.",
            name: "Magmatic Fabric",
            emoji: "🌋",
        }
    },
    getEffect(level, context) {
        return {
            multiply: 0.4 ** level,
            exponent: 1.25 ** level,
        }
    },
    type() { return FabricUpgradeTypes.FLAT_BONUS },
    isUnique() { return false; }
}