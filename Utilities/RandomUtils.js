/*
RandomUtils.js
Version: 1.1.0
Description: Random number generation and selection utilities for ranges, arrays, and objects.
Author: Bennyp3333 [https://benjamin-p.dev]
*/

/**
 * Generates a random number between the specified range [lo, hi].
 * @param {number} lo - The lower bound of the range.
 * @param {number} hi - The upper bound of the range.
 * @returns {number} A random number between lo and hi.
 */
function randomRange(lo, hi) {
    return Math.random() * (hi - lo) + lo;
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

/**
 * Creates a random number generator that produces evenly distributed values
 * by avoiding clustering with recently generated numbers.
 * 
 * Uses rejection sampling to ensure each output is sufficiently spaced
 * from recent values, preventing visual bunching when used for positioning.
 * 
 * @param {number} min - Minimum value of the range (inclusive)
 * @param {number} max - Maximum value of the range (exclusive)
 * @param {number} minSpacing - Minimum required distance from recent values
 * @param {number} [historySize=3] - Number of previous values to check against
 * @returns {function(): number} Generator function that returns a distributed random value
 * 
 * @example
 * const getSpawnX = createDistributedRandom(0, 1, 0.2, 3);
 * const x1 = getSpawnX(); // e.g., 0.72
 * const x2 = getSpawnX(); // e.g., 0.31 (at least 0.2 away from x1)
 */
function createDistributedRandom(min, max, minSpacing, historySize = 3) {
    const history = [];
    
    return function() {
        const range = max - min;
        let value;
        let attempts = 0;
        const maxAttempts = 50;
        
        do {
            value = min + Math.random() * range;
            attempts++;
            
            const tooClose = history.some(prev => Math.abs(value - prev) < minSpacing);
            
            if (!tooClose || attempts >= maxAttempts) break;
        } while (true);
        
        history.push(value);
        if (history.length > historySize) history.shift();
        
        return value;
    };
}

// Exporting the functions
var exports = {
    randomRange,
    arrayRandom,
    objectRandom,
    createDistributedRandom
};

if(script){
    script.exports = exports;
    if(!global.utils){ global.utils = {}; }
    Object.assign(global.utils, exports);
}else{
    module.exports = exports;
}