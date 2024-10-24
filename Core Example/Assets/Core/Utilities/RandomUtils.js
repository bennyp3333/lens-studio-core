/**
 * Generates a random number between the specified range [lo, hi].
 * @param {number} lo - The lower bound of the range.
 * @param {number} hi - The upper bound of the range.
 * @returns {number} A random number between lo and hi.
 */
function randomRange(lo, hi) {
    return Math.random() * (lo - hi) + lo;
}

/**
 * Selects a random element from an array.
 * @param {Array} arr - The array to select a random element from.
 * @returns {*} A random element from the array.
 */
function arrayRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Selects a random value from an object by choosing a random key.
 * @param {Object} obj - The object to select a random value from.
 * @returns {*} A random value from the object.
 */
function objectRandom(obj) {
    var keys = Object.keys(obj);
    return obj[arrayRandom(keys)];
}

// Exporting the functions
var exports = {
    randomRange,
    arrayRandom,
    objectRandom
};

if(script){
    script.exports = exports;
    if(!global.utils){ global.utils = {}; }
    Object.assign(global.utils, exports);
}else{
    module.exports = exports;
}