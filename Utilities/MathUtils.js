/**
 * Linearly interpolates between two values a and b based on the interpolation factor t.
 * @param {number} a - The start value.
 * @param {number} b - The end value.
 * @param {number} t - The interpolation factor (0.0 to 1.0).
 * @returns {number} The interpolated value between a and b.
 */
function lerp(a, b, t) {
    return a * (1.0 - t) + b * t;
}

/**
 * Clamps a value between a minimum and maximum.
 * @param {number} val - The value to clamp.
 * @param {number} min - The minimum value.
 * @param {number} max - The maximum value.
 * @returns {number} The clamped value.
 */
function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
}

/**
 * Remaps a number from one range to another and optionally clamps the result within the output range.
 * @param {number} val - The value to remap.
 * @param {number} inMin - The lower bound of the input range.
 * @param {number} inMax - The upper bound of the input range.
 * @param {number} outMin - The lower bound of the output range.
 * @param {number} outMax - The upper bound of the output range.
 * @param {function} [clamp] - An optional function to clamp the result within the output range.
 * @returns {number} The remapped value, clamped if the `clamp` function is provided.
 */
function remap(val, inMin, inMax, outMin, outMax, clamp) {
    var mapped = ((val - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
    if (clamp) {
        mapped = clamp(mapped, outMin, outMax);
    }
    return mapped;
}

/**
 * Checks if two values are approximately equal within a certain epsilon range.
 * @param {number} v1 - The first value.
 * @param {number} v2 - The second value.
 * @param {number} [epsilon=0.001] - The tolerance range for comparison (optional, default is 0.001).
 * @returns {boolean} True if the values are approximately equal, false otherwise.
 */
function approxEqual(v1, v2, epsilon) {
    if (epsilon == null) {
        epsilon = 0.001;
    }
    return Math.abs(v1 - v2) < epsilon;
}

/**
 * Converts degrees to radians.
 * @param {number} degrees - The value in degrees.
 * @returns {number} The value in radians.
 */
function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Converts radians to degrees.
 * @param {number} radians - The value in radians.
 * @returns {number} The value in degrees.
 */
function radiansToDegrees(radians) {
    return radians * (180 / Math.PI);
}

// Exporting the functions
var exports = {
    lerp,
    clamp,
    remap,
    approxEqual,
    degreesToRadians,
    radiansToDegrees
};

if(script){
    script.exports = exports;
    if(!global.utils){ global.utils = {}; }
    Object.assign(global.utils, exports);
}else{
    module.exports = exports;
}