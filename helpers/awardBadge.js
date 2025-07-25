const { getEmoji } = require('../helpers/emojis.js');
const { getEmbeddedCommand } = require('../helpers/embedCommand.js');
const database = require('./database.js');
const log = require('./log.js');

async function awardBadge(userId, badge, client) {
    const player = await database.Player.findOne({
        where: {
            userId: userId,
        },
    });
    if (!player) {
        await log(`[WARN] tried to award badge ${badge} to user ${userId} but the user somehow doesn't exist`, client);
        return false;
    }

    let badgeObj = null;
    
    // allow for badge name or id to be passed in
    if (typeof badge === 'string') {
        badgeObj = await database.Badge.findOne({
            where: {
                name: badge,
            },
        });
    } else if (typeof badge === 'number') {
        badgeObj = await database.Badge.findByPk(badge);
    } else {
        await log(`[WARN] tried to award badge ${badge} but it's not a string or number`, client);
        return false; // no idea what this could be
    }

    if (!badgeObj) {
        await log(`[WARN] tried to award badge ${badge} but it doesn't exist`, client);
        return false;
    }

    let ownedBadges = player.badges || [];

    if (ownedBadges.includes(badgeObj.dbId.toString())) { // already owned
        return false;
    }

    ownedBadges.push(badgeObj.dbId.toString());
    await player.update({
        badges: ownedBadges,
    });

    const dmablePlayer = await client.users.fetch(userId);
    if (dmablePlayer) {
        await dmablePlayer.send(
`**you've earned a badge!**
${getEmoji(badgeObj.emoji)} ${badgeObj.name}
*"${badgeObj.flavorText}"*
${badgeObj.description}

you can show off your badges with ${getEmbeddedCommand('badges showcase')}.`);
    }

    return true;
}

module.exports = awardBadge;