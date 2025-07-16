const { FabricUpgradeTypes } = require('../../../helpers/upgradeEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice() {
        return 45;
    },
    getDetails() {
        return {
            description: `
2 additional ping buttons are created, and each ping button will have a unique symbol attached to it.
gain a passive **^1.15** bonus.
clicking the same symbol twice in a row will result in a **^0.7** debuff, with no bonus.`,
            name: "Fabric of the Artisan",
        }
    },
    getEffect(_level, context) {
        return {
            add: 0,
            multiply: 1,
        }
    },
    sortOrder() { return 1000 },
    type() { return FabricUpgradeTypes.SKILL_BASED }
}