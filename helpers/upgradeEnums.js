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
const FabricUpgradeTypes = {
    FLAT_BONUS: 'Flat Bonus',
    BLUE_PING: 'Blue Modification',
    PURE_RANDOM: 'Random Chance',
    SKILL_BASED: 'Skill-Based',
    MISC: 'Miscellaneous',
}   

Object.freeze(UpgradeTypes);
Object.freeze(PipUpgradeTypes);
Object.freeze(FabricUpgradeTypes);

module.exports = { UpgradeTypes, PipUpgradeTypes, FabricUpgradeTypes };