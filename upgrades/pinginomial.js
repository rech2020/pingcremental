module.exports = {
    getPrice(currentLevel) {
        return Math.round(100*(3**currentLevel))
    },
    getDetails() {
        return {
            description: "gain __+2^(level-1)__ pts",
            name: "pinginomial",
        }
    },
    getEffectString(level) {
        return level === 0 ? "+0" : `+${2**(level-1)}`
    },
    getEffect(level, context) {
        return {
            add: 2**(level-1),
        }
    },
    isBuyable(context) {
        return true;
    },
    sortOrder() { return 3 }
}