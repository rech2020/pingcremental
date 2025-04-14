import UpgradeTypes from '../helpers/upgradeEnums';

module.exports = {
    getPrice(currentLevel) {
        return currentLevel === 0 ? 777 : null;
    },
    getDetails() {
        return {
            description: "get +7 pts when ping ends in 7",
            name: "lucky number 7",
        }
    },
    getEffectString(level) {
        return level === 1 ? "+7" : "+0";
    },
    getEffect(level, context) {
        return {
            add: (context.ping % 10 === 7) ? 7 : undefined,
        }
    },
    isBuyable(context) {
        return Object.keys(context.upgrades).includes('special');
    },
    sortOrder() { return 101 },
    type() { return UpgradeTypes.ONE_TIME }
}