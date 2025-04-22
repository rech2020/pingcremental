const { PipUpgradeTypes } = require('../../../helpers/upgradeEnums.js');

module.exports = {
    getPrice(currentLevel) {
        return Math.round(2500 * ((currentLevel+1)**1.1))
    },
    getDetails() {
        return {
            description: "start with __10,000__ pts",
            name: "Distant Memories",
            emoji: "✨",
            flavor: "your past isn't worthless. don't forget it.",
        }
    },
    getEffectString(level) {
        return `${level*10}K pts`
    },
    getEffect(level, context) {
        return {}
    },
    upgradeRequirements() {
        return { beginning: 1 };
    },
    sortOrder() { return 301 },
    type() { return PipUpgradeTypes.KEEP }
}