module.exports = {
    getPrice(currentLevel) {
        return 500 * (2^currentLevel)
    },
    getDetails() {
        return {
            description: "__+0.6%__ chance to spawn a blue ping (additive)",
            name: "blueshift",
        }
    },
    getEffectString(level) {
        return `+${(0.6*level).toFixed(1)}%`
    },
    getEffect(level, context) {
        return {
            blue: level*0.6
        }
    },
    isBuyable(upgrades) {
        return upgrades.contains('blue')
    }
}