module.exports = {
    getPrice(currentLevel) {
        return Math.round(1000*(1.75**currentLevel))
    },
    getDetails() {
        return {
            description: "gain __+1__ pt for every __350__ clicks",
            name: "inpingity",
        }
    },
    getEffectString(level) {
        return `+${level} per ${350-level+1} clicks`
    },
    getEffect(level, context) {
        return {
            add: level * (context.clicks/(350-level+1)),
        }
    },
    isBuyable(context) {
        return context.clicks >= 1000;
    },
    sortOrder() { return 8 },
}