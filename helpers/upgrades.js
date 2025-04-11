const fs = require('fs');
const path = require('path');

const upgradeFolderPath = path.join(__dirname, '../upgrades');
const upgradeFiles = fs.readdirSync(upgradeFolderPath).filter(file => file.endsWith('.js'));
var list = {}; // list of all upgrades

for (const file of upgradeFiles) {
	const filePath = path.join(upgradeFolderPath, file);
	list[file.replace('.js','')] = require(filePath);
}

module.exports = list

/*
UPGRADE IDEAS

"X" = level of upgrade
note: figure out formulas for cost

- "slower internet"
    +X points per ping
    costs 100 -> 150 -> 225 -> 337 -> 506 -> 759 -> 1138 -> 1707 -> 2560 -> 3840 -> 5760 -> 8640 -> 12960
- "prioritize usability"
    +X*3 points when ping <=50
    costs 150 -> 300 -> 500 -> 800 -> 1300 -> 2100 -> 3400 -> 5500 -> 8900 -> 14400 -> 23300 -> 37700 -> 61000
- "blue ping" (1-time)
    1% chance of spawning a super ping that is 15x as strong
    costs 1000
- "blueshift" (req. blue ping)
    +0.6*X% (additive) chance of spawning blue ping
    costs 500 -> 1000 -> 2000 -> 4000 -> 8000 -> 16000 -> 32000 -> 64000 -> 128000 -> 256000 -> 512000 -> 1024000 -> 2048000
- "redshift" (req. blue ping)
    -0.4*X% (additive) chance of spawning blue ping; +5*X% overall points
    costs 250 -> 750 -> 1250 -> 2000 -> 3000 -> 5000 -> 8000 -> 13000 -> 21000 -> 34000 -> 55000 -> 89000 -> 144000
- "i feel special" (1-time)
    getting a rare message gives 100x points
    costs 10000
- "fine, just have a multiplier"
    +X% points overall
    costs 100 -> 200 -> 300 -> 500 -> 800 -> 1300 -> 2100 -> 3400 -> 5500 -> 8900 -> 14400 -> 23300 -> 37700 -> 61000
- "inpingity"
    +X*clicks*0.01 points per ping (round down)
    costs 1000 -> 2500 -> 4000 -> 6000 -> 9000 -> 13000 -> 20000 -> 30000 -> 45000 -> 70000 -> 100000 -> 150000 -> 200000
- "pinginomial"
    +2^(X-1) points per ping
    costs 100 -> 300 -> 900 -> 2700 -> 8100 -> 24300 -> 72900 -> 218700 -> 656100 -> 1968300 -> 5904900 -> 17714700 -> 53144100
- "pipiping"
    X*1.5% chance of gaining 3x points
    costs 350 -> 750 -> 1500 -> 2500 -> 4000 -> 6000 -> 9000 -> 13000 -> 20000 -> 30000 -> 45000 -> 70000 -> 100000
- "pingularity" (1-time)
    it's a mystery
    costs 1000000
*/