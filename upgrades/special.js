module.exports = {
    getPrice(currentLevel) {
        return currentLevel === 0 ? 3000 : null
    },
    getDetails() {
        return {
            description: "getting a rare ping message gives 100x pts",
            name: "i feel special",
        }
    },
    getEffectString(level) {
        return level === 0 ? "1x" : "100x"
    },
    getEffect(level, context) {
        return {
            multiply: context.rare ? 100 : 1,
        }
    },
    isBuyable(context) {
        return true;
    }
}