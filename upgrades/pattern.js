module.exports = {
    getPrice(currentLevel) {
        let origPrice = 888 * (2.6^(currentLevel)) // split for sake of being readable
        return Math.round(origPrice/1000)*1000 + 888
    },
    getDetails() {
        return {
            description: "gain __x1.05__ pts when last two digits of ping are the same",
            name: "pattern recognision",
        }
    },
    getEffectString(level) {
        return `x${1+level*0.05.toFixed(2)}`
    },
    getEffect(level, context) {
        const pString = `${context.ping}`
        return {
            multiply: (pString[0] === pString[1]) ? 1 + (level*0.05) : 1,
        }
    },
    isBuyable(context) {
        return Object.keys(context.upgrades).includes('lucky');
    }
}