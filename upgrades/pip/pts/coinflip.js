const { PipUpgradeTypes } = require('../../../helpers/upgradeEnums.js');

module.exports = {
    getPrice(currentLevel) {
        return Math.round(100 * (currentLevel + 3)**3) + 1212;
    },
    getDetails() {
        return {
            description: "flip a coin until you land on heads, and gain __x1.1__ (multiplicative) pts for every tails you land on",
            name: "Eternal Coinflip",
            emoji: "✨",
            flavor: "the coin has been flipping endlessly from the moment it was tossed.", // this is a phigros reference!
        }
    },
    getEffectString(level) {
        return `x${level*1.1}`
    },
    getEffect(level, context) {
        let heads = false;
        let tails = 0;
        let mult = 1;

        while (!heads) {
            heads = Math.random() > (0.5 / context.specials.RNGmult);
            if (!heads) {
                mult *= (1.1 * level);
                tails++;
            }
        }

        return {
            multiplier: mult,
            message: `${tails} tails`,
        }
    },
    upgradeRequirements() {
        return { glamour: 1 };
    },
    sortOrder() { return 4 },
    type() { return PipUpgradeTypes.BONUS }
}