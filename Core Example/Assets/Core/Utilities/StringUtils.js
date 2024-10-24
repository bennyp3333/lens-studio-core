/**
 * Calculates the similarity between two strings based on their edit distance.
 * The result is a value between 0.0 (completely different) and 1.0 (exactly the same).
 * @param {string} s1 - The first string.
 * @param {string} s2 - The second string.
 * @returns {number} A number between 0.0 and 1.0 representing the similarity between the two strings.
 */
function stringSimilarity(s1, s2) {
    var longer = s1;
    var shorter = s2;
    if (s1.length < s2.length) {
        longer = s2;
        shorter = s1;
    }
    var longerLength = longer.length;
    if (longerLength == 0) {
        return 1.0;
    }
    return (longerLength - getEditDistance(longer, shorter)) / parseFloat(longerLength);
}

/**
 * Calculates the edit distance (Levenshtein distance) between two strings.
 * The edit distance is the minimum number of single-character edits required to change one string into the other.
 * @param {string} s1 - The first string.
 * @param {string} s2 - The second string.
 * @returns {number} The edit distance between the two strings.
 */
function getEditDistance(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();

    var costs = new Array();
    for (var i = 0; i <= s1.length; i++) {
        var lastValue = i;
        for (var j = 0; j <= s2.length; j++) {
            if (i == 0)
                costs[j] = j;
            else {
                if (j > 0) {
                    var newValue = costs[j - 1];
                    if (s1.charAt(i - 1) != s2.charAt(j - 1))
                        newValue = Math.min(Math.min(newValue, lastValue),
                            costs[j]) + 1;
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
        }
        if (i > 0)
            costs[s2.length] = lastValue;
    }
    return costs[s2.length];
}

/**
 * Generates a random string of the specified length using alphanumeric characters.
 * @param {number} len - The length of the random string to generate.
 * @returns {string} A random string of the specified length.
 */
function randomId(len) {
    var result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    var counter = 0;
    while (counter < len) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}

/**
 * Splits a text string into chunks of a specified maximum length, 
 * attempting to split on preferred characters like spaces or punctuation.
 * @param {string} txt - The text to split into chunks.
 * @param {number} len - The maximum length of each chunk.
 * @returns {string[]} An array of text chunks.
 */
function chunkText(txt, len) {
    var txtToChunk = txt;
    var maxLength = len;
    var splitChars = ["\n", ".", ",", " "];
    var splitHistic = [1.00, 0.75, 0.5, 0.25];
    var chunks = [];
    while (txtToChunk.length > 0) {
        var splitsFound = Array(splitChars.length);
        for (var i = 0; i < txtToChunk.length; i++) {
            var char = txtToChunk.charAt(i);
            if (splitChars.includes(char)) {
                splitsFound[splitChars.indexOf(char)] = i + 1;
            }
            if (i >= txtToChunk.length - 1) {
                var splitAt = i + 1;
                chunks.push(txtToChunk.substring(0, splitAt));
                txtToChunk = txtToChunk.substring(splitAt, txtToChunk.length);
                break;
            }
            if (i >= maxLength - 1) {
                var splitAt = i + 1;
                var splitsScore = Array(splitChars.length);
                for (var s = 0; s < splitChars.length; s++) {
                    if (splitsFound[s]) {
                        splitsScore[s] = splitHistic[s] * (splitsFound[s] / maxLength);
                    } else {
                        splitsScore[s] = null;
                    }
                }
                var idxMaxScore = global.myTools.indexOfMax(splitsScore);
                if (idxMaxScore != null) {
                    splitAt = splitsFound[idxMaxScore];
                }
                chunks.push(txtToChunk.substring(0, splitAt));
                txtToChunk = txtToChunk.substring(splitAt, txtToChunk.length);
                break;
            }
        }
    }
    return chunks;
}

// Exporting the functions
var exports = {
    stringSimilarity,
    randomId,
    chunkText
};

if(script){
    script.exports = exports;
    if(!global.utils){ global.utils = {}; }
    Object.assign(global.utils, exports);
}else{
    module.exports = exports;
}