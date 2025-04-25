function formatNumber(num, shortHand = false) {
    if (num === null || num === undefined) return '0'; // handle null or undefined values

    const numStr = num.toString();

    const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc', 'Ud', 'Dd', 'Td', 'Qd', 'Qn', 'Vg', 'Tg', 'Qvg', 'Qtg', 'Pnt', 'Sxt', 'Spt', 'Oct', 'Nnt', 'Dct']; //no one will get to these but better save than sorry :3  

    if (numStr.includes("e")) { 
        // If number is in scientific notation, apply suffix instead
        const magnitude = Math.floor(Math.log10(num));
        const suffixIndex = Math.floor(magnitude / 3);

        const baseNum = (num / Math.pow(10, suffixIndex * 3)).toFixed(2);
        return baseNum + (suffixes[suffixIndex] || '');
    }

    if (numStr.length < 4) return numStr; // if less than 4 digits, return as is

    if (!shortHand) { 
        return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ','); 
    }

    const suffixIndex = Math.floor((numStr.length - 1) / 3); 

    const baseNum = (Math.ceil((num * 1000 / Math.pow(10, suffixIndex * 3))) / 1000).toFixed(2); 

    return baseNum + suffixes[suffixIndex]; 
}

module.exports = formatNumber;
