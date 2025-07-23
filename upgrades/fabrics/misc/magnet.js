const { FabricUpgradeTypes } = require('../../../helpers/upgradeEnums.js');

module.exports = {
    getPrice() {
        return 144;
    },
    getDetails() {
        return {
            description: 
`gain **1** APT per 2 minutes not pinging, up to a maximum of **720** (24 hours) without claiming.`,
            name: "APT Magnet Fabric", // this does mean APT is canonically metal
            emoji: "🧲",
        }
    }, 
    getEffect(_level, context) {
        // NOTE/TODO: this effect has to be implemented when merged with the autoping system
    },
    type() { return FabricUpgradeTypes.MISC },
    isUnique() { return false; }
}