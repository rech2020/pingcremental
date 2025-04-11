module.exports = {
    getPrice(currentLevel) {
        if (currentLevel === 0) return 1000
        else return null;
    },
    getDetails() {
        return {
            description: "1% chance of spawning a blue ping for 15x pts",
            name: "blue ping",
        }
    },
    getEffectString(level) {
        return level === 0 ? "0% chance" : "1% chance"
    },
    getEffect(level, context) {
        return {
            special: "blueping"
        };
    },
    isBuyable(context) {
        return true;
    },
    sortOrder() { return 10 },
}