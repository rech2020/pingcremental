const { FabricUpgradeTypes, PingCalculationStates } = require('../../../helpers/commonEnums.js');

let recentPingTimes = {}
let bonusCache = {}
let comboCache = {}

const COMBO_WINDOW = 160;
const GREAT_WINDOW = 90;
const PERFECT_WINDOW = 50;
const PURE_WINDOW = 15;

module.exports = {
    getPrice() {
        return 150;
    },
    getDetails() {
        return {
            description:
`clicking in a rhythm will grant a scaling bonus up to **^1.2**.
clicking too far off rhythm will break the combo. 
skipping one beat is okay, but more will break the combo.`,
            name: "Fabric of the Orchestra",
            emoji: "🎶",
        }
    },
    getEffect(_level, context) {
        if (context.state !== PingCalculationStates.SCORING) return {};

        if (!context.interactionTimestamp) return {};
        if (!recentPingTimes[context.user.id]) {
            recentPingTimes[context.user.id] = [];
        }

        let msg = "";

        const timeSinceLast = context.interactionTimestamp - (recentPingTimes[context.user.id][0] || 0);
        const length = recentPingTimes[context.user.id].unshift(context.interactionTimestamp);

        if (length < 5) {
            return {
                message: `keep the rhythm... (${length}/5)`,
            }
        }
        if (length > 15) {
            recentPingTimes[context.user.id].pop();
        }


        const intervals = [];
        for (let i = 0; i < Math.min(length - 1, 10); i++) {
            intervals.push(recentPingTimes[context.user.id][i] - recentPingTimes[context.user.id][i + 1]);
        }
        
        intervals.sort((a, b) => a - b);
        const medianInterval = intervals.length % 2 === 0
            ? (intervals[intervals.length / 2 - 1] + intervals[intervals.length / 2]) / 2
            : intervals[Math.floor(intervals.length / 2)];
        
        const targetTime = medianInterval;
        let distFromTarget = timeSinceLast - targetTime;
        
        if (Math.abs(distFromTarget - targetTime) < Math.abs(distFromTarget)) {
            // skipped a beat, probably
            distFromTarget -= targetTime;
            msg += "SK"
        }

        if (Math.abs(distFromTarget) > COMBO_WINDOW) {
            bonusCache[context.user.id] = 1;
            comboCache[context.user.id] = 0;
            if (distFromTarget > 0) {
                msg += `EARLY!`;
            } else {
                msg += `LATE!`;
            }
        }

        if (Math.abs(distFromTarget) >= COMBO_WINDOW * 2) {
            recentPingTimes[context.user.id] = [];
        }

        if (distFromTarget > 0 && Math.abs(distFromTarget) < COMBO_WINDOW) {
            msg += `L`
        } else if (distFromTarget < 0 && Math.abs(distFromTarget) < COMBO_WINDOW) {
            msg += `E`
        }

        if (Math.abs(distFromTarget) < PURE_WINDOW) {
            addBonus(context.user.id, 3 / 100);
            msg = `PURE!`;
        } else if (Math.abs(distFromTarget) < PERFECT_WINDOW) {
            addBonus(context.user.id, 1 / 100);
            msg = `perfect!`;
        } else if (Math.abs(distFromTarget) < GREAT_WINDOW) {
            addBonus(context.user.id, 0.4 / 100);
            msg += `great!`;
        } else if (Math.abs(distFromTarget) <= COMBO_WINDOW) {
            addBonus(context.user.id, 0); // only maintains combo
            msg += `okay!`;
        }

        return {
            exponent: bonusCache[context.user.id],
            message: `${msg} (x${comboCache[context.user.id]})`,
        }
    },
    type() { return FabricUpgradeTypes.SKILL_BASED },
    isUnique() { return true; }
}

function addBonus(userId, amount) {
    if (!bonusCache[userId]) {
        bonusCache[userId] = 1;
    }
    bonusCache[userId] = Math.min(bonusCache[userId] + amount, 1.2);
    comboCache[userId] = (comboCache[userId] || 0) + 1;
}