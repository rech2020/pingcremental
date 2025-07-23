const { FabricUpgradeTypes } = require('../../../helpers/upgradeEnums.js');

module.exports = {
    getPrice() {
        return 35;
    },
    getDetails() {
        return {
            description: 
`gain **^1.01** pts per blue ping in a chain (e.g. 2 in a row gives ^1.02 pts).
increases the blue ping chance after another blue ping by **10%** (NOT bypassing the cap).`,
            name: "Cascading Fabric",
            emoji: "🌊",
        }
    },
    getEffect(level, context) {
        if (context.blueCombo > 0) {
            return {
                exponent: 1 + (0.01 * level * context.blueCombo),
                blue: 10 * level,
            }
        }

        return {};
    },
    type() { return FabricUpgradeTypes.BLUE_PING },
    isUnique() { return false; }
}