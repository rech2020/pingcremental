const { UpgradeTypes } = require('../../../helpers/upgradeEnums.js');
const { getEmoji } = require('../../../helpers/emojis.js');

module.exports = {
    getPrice(currentLevel) {
        return Math.round( 100 * (( 1.5 + ( currentLevel * 0.2 )) ** (currentLevel*0.75)))
    },
    getDetails() {
        return {
            description: "gain the __(level+1)__th number in the fibbonacci sequence (1, 2, 3, 5, 8, etc.) as pts",
            name: "pinginacci",
            emoji: getEmoji('upgrade_pinginomial', "📈"),
        }
    },
    getEffectString(level) {
        return level === 0 ? "+0" : `+${getFib(level+1)}`;
    },
    getEffect(level, context) {
        return {
            add: getFib(level+1),
        }
    },
    isBuyable(context) {
        return true;
    },
    sortOrder() { return 3 },
    type() { return UpgradeTypes.ADD_BONUS }
}

function getFib(n) {
    const fib = [0, 1];

    for (let i = 2; i <= n; i++) {
        fib[i] = fib[i - 1] + fib[i - 2];
    }

    return fib[n];
}