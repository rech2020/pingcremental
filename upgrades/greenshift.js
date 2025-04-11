module.exports = {
    getPrice(currentLevel) {
        if (currentLevel >= 5) return null; // max of 5
        return Math.round(1250 * (2.2**(currentLevel^1.25)));
    },
    getDetails() {
        return {
            description: "__x1.1__ chance to spawn a blue ping",
            name: "greenshift?",
        }
    },
    getEffectString(level) {
        return `x${1+level*0.1}`
    },
    getEffect(level, context) {
        return {
            blue: context.blue * level * 0.1
        }
    },
    isBuyable(context) {
        if (!context.upgrades['blue'] || !context.upgrades['redshift']) return false;
        return context.upgrades['redshift'] >= 4;
    },
    sortOrder() { return 13 },
}