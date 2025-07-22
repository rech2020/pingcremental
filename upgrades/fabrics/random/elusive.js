const { FabricUpgradeTypes } = require('../../../helpers/upgradeEnums.js');

module.exports = {
    getPrice() {
        return 53;
    },
    getDetails() {
        return {
            description: "rare pings give a bonus **^1.35** pts.",
            name: "Elusive Fabric",
            emoji: "💍",
        }
    },
    getEffect(_level, context) {
        if (context.rare) {
            return {
                exponent: 1.35,
            }
        }

        return {};
    },
    type() { return FabricUpgradeTypes.PURE_RANDOM },
    isUnique() { return false; }
}