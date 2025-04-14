import UpgradeTypes from '../helpers/upgradeEnums';

module.exports = {
    getPrice(currentLevel) {
        return 250 * (2**currentLevel)
    },
    getDetails() {
        return {
            description: "__-0.4%__ chance to spawn a blue ping (additive), but __x1.05__ pts",
            name: "redshift",
        }
    },
    getEffectString(level) {
        return `-${(0.4*level).toFixed(1)}% chance, x${(1+level*0.05).toFixed(2)} pts`
    },
    getEffect(level, context) {
        return {
            blue: level*-0.4,
            multiply: 1+(level*0.05)
        }
    },
    isBuyable(context) {
        return Object.keys(context.upgrades).includes('blue')
    },
    sortOrder() { return 12 },
    type() { return UpgradeTypes.BLUE_PING }
}