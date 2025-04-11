const fs = require('fs');
const path = require('path');

const upgradeFolderPath = path.join(__dirname, '../upgrades');
const upgradeFiles = fs.readdirSync(upgradeFolderPath).filter(file => file.endsWith('.js'));
var list = {}; // list of all upgrades

for (const file of upgradeFiles) {
    const filePath = path.join(upgradeFolderPath, file);
    list[file.replace('.js', '')] = require(filePath);
}

// Sort the upgrades by their sortOrder() in ascending order
const sortedUpgrades = Object.entries(list)
    .sort(([, a], [, b]) => a.sortOrder() - b.sortOrder())
    .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
    }, {});

module.exports = sortedUpgrades;