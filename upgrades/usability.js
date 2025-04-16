const UpgradeTypes = require('../helpers/upgradeEnums.js');

module.exports = {
    getPrice(currentLevel) {
        let price = 150;
        for (let i = 0; i < currentLevel; i++) {
            price += (i+3)*50
        }
        price = Math.round(price * (1.1**currentLevel));
        return price;
    },
    getDetails() {
        return {
            description: "gain __+2__ pts when ping is less/equal to 50",
            name: "prioritize usability",
            emoji: "<:upgrade_usability:1361881470875996352>",
        }
    },
    getEffectString(level) {
        return `+${level*2} pts`
    },
    getEffect(level, context) {
        return {
            add: context.ping <= 50 ? level*2 : 0,
        }
    },
    isBuyable(context) {
        return true;
    },
    sortOrder() { return 2 },
    type() { return UpgradeTypes.ADD_BONUS }
}