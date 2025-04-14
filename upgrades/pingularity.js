import UpgradeTypes from '../helpers/upgradeEnums';

module.exports = {
    getPrice(currentLevel) {
        return currentLevel === 0 ? 1000000 : null;
    },
    getDetails() {
        return {
            description: "?",
            name: "pingularity",
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