const { PipUpgradeTypes } = require('../../../helpers/upgradeEnums.js');

module.exports = {
    getPrice(currentLevel) {
        return Math.round(1200 * (3**currentLevel)) + 1523;
    },
    getDetails() {
        return {
            description: "5% of your Glimmer clicks are used instead of 1, gain an extra __x1.15__ pts for each additional one used",
            name: "Refract",
            emoji: "✨",
            flavor: "'i can see the light!' - someone long forgotten",
        }
    },
    getEffectString(level) {
        return `${(level*0.15)+1}x each`
    },
    getEffect(level, context) {
        if (!context.glimmerClicks) return {};
        if (context.isSuper) return {};

        const extraGlimmer = Math.floor(context.glimmerClicks / 5);
        const mult = (level*0.15+1) ** extraGlimmer;

        if (mult === 1) return {};
        return {
            special: {
                "glimmer": -(extraGlimmer + 1)
            },
            multiply: mult,
            message: `(used ${extraGlimmer} extra)`
        }
    },
    upgradeRequirements() {
        return { indigo: 2 };
    },
    sortOrder() { return 1000 },
    type() { return PipUpgradeTypes.BLUE_PING }
}