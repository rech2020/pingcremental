const UpgradeTypes = {
    ADD_BONUS: 'addition',
    MULT_BONUS: 'multiplying',
    BLUE_PING: 'blue ping',
    ONE_TIME: 'one time',
    PRESTIGE: 'pingularity',
}
const PipUpgradeTypes = {
    BONUS: 'Increment',
    BLUE_PING: 'Distort',
    MISC: 'Influence',
    KEEP: 'Remember',
    PRESTIGE: 'Repeat',
}

const PingCalculationStates = {
    RNG_AND_SPECIAL: 0,
    SCORING: 1,
    POST_SCORING: 2,
}

Object.freeze(UpgradeTypes);
Object.freeze(PipUpgradeTypes);
Object.freeze(PingCalculationStates);

module.exports = { UpgradeTypes, PipUpgradeTypes, PingCalculationStates };