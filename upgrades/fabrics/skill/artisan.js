const { FabricUpgradeTypes } = require('../../../helpers/upgradeEnums.js');

export const artisanSymbols = ["✿", "✦", "⁂"]

let lastClickedSymbolCache = {}
let bonusCache = {}

module.exports = {
    getPrice() {
        return 75;
    },
    getDetails() {
        return {
            description: 
`2 additional ping buttons are created, and each ping button will have a unique symbol attached to it.
clicking grants a scaling bonus as no mistakes are made, up to **^1.15** (at 50 clicks in a row).
clicking the same symbol twice in a row will result in a **^0.7** debuff, and resets the bonus to nothing.`,
            name: "Fabric of the Artisan",
            emoji: "✒️",
        }
    },
    getEffect(_level, context) {
        if (!context.artisanClickedSymbol) return { special: { artisan: true } };

        lastClickedSymbolCache[context.user.id] = context.artisanClickedSymbol;
        let exponent = 1;
        
        if (context.artisanClickedSymbol && context.artisanClickedSymbol === lastClickedSymbolCache[context.user.id]) {
            exponent = 0.7;
        } else if (context.artisanClickedSymbol && lastClickedSymbolCache[context.user.id]) {
            bonusCache[context.user.id] = Math.min((bonusCache[context.user.id] || 1) + (0.15 / 50), 1.15);

            exponent = bonusCache[context.user.id];
        }

        return {
            exponent: exponent,
            special: {
                artisan: true,
            },
            message: `(${context.artisanClickedSymbol || "?"})`,
        }
    },
    type() { return FabricUpgradeTypes.SKILL_BASED },
    isUnique() { return true; }
}