function formatNumber(num, shortHand = false) {
    if (num === null || num === undefined) return '0'; // handle null or undefined values

    const numStr = num.toString();

    if (numStr.length < 4) return numStr; // if less than 4 digits, return as is

    if (!shortHand) { 
        return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ','); // every 3 digits, add a comma (e.g. 1000 -> 1,000)
    }

    // if shorthand, convert to K, M, B, T, etc.
    const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc', 'Ud', 'Dd', 'Td', 'Qd', 'Qn'];   
    const suffixIndex = Math.floor((numStr.length - 1) / 3); // determine the suffix index based on the length of the number

    const baseNum = (Math.ceil((num * 1000 / Math.pow(10, suffixIndex * 3))) / 1000).toFixed(2); // divide by 1000^suffixIndex and round to 2 decimal places

    return baseNum + suffixes[suffixIndex]; // return the number with the appropriate suffix
}

module.exports = formatNumber;