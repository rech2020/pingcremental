module.exports = {
    getPrice(currentLevel) {
        let price = 150;
        for (let i = 0; i < currentLevel; i++) {
            price += (i+3)*50
        }
        return price;
    },
    getDetails() {
        return {
            description: "gain __+3__ pts when ping is less/equal to 50",
            name: "prioritize usability",
        }
    },
    getEffectString(level) {
        return `+${level*3} pts`
    },
    getEffect(level, context) {
        return {
            add: context.ping <= 50 ? level*3 : 0,
        }
    },
    isBuyable(context) {
        return true;
    }
}