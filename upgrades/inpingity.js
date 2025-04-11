module.exports = {
    getPrice(currentLevel) {
        return Math.round(1000*(1.75^currentLevel))
    },
    getDetails() {
        return {
            description: "gain __+(0.01 x clicks)__ pts",
            name: "inpingity",
        }
    },
    getEffectString(level) {
        return `+(${(level*0.01).toFixed(2)} x clicks)`
    },
    getEffect(level, context) {
        return {
            add: level*0.01*context.clicks,
        }
    },
    isBuyable(context) {
        return context.clicks >= 1000;
    }
}