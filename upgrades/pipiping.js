module.exports = {
    getPrice(currentLevel) {
        if (currentLevel*1.5 >= 30) return null; // 30% max
        return 350 * (2^currentLevel)
    },
    getDetails() {
        return {
            description: "__+1.5%__ (additive) chance to get x3 pts",
            name: "pipiping",
        }
    },
    getEffectString(level) {
        return `${level*1.5.toFixed(1)}%`
    },
    getEffect(level, context) {
        return {
            multiply: Math.random()*1000 <= (level*15) ? 3 : undefined,
        }
    },
    isBuyable(context) {
        return true;
    }
}