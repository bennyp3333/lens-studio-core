/*
MathUtils.js
Version: 1.1.0
Description: Mathematical operations and helper functions for interpolation, clamping, remapping, and conversions.
Author: Bennyp3333 [https://benjamin-p.dev]
*/

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
 * @param {boolean} [shouldClamp=false] - Whether to clamp the result within the output range.
 * @returns {number} The remapped value, clamped if `shouldClamp` is true.
 */
function remap(val, inMin, inMax, outMin, outMax, shouldClamp) {
    var mapped = ((val - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
    if (shouldClamp) {
        mapped = clamp(mapped, Math.min(outMin, outMax), Math.max(outMin, outMax));
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

/**
 * Rotates a quaternion by the given angle (in degrees) around an axis vector.
 * @param {quat} currentRot - The base rotation quaternion.
 * @param {number} angle - The angle to rotate in degrees.
 * @param {vec3} axisVector - The axis to rotate around.
 * @returns {quat} The resulting quaternion after rotation.
 */
function rotateQuat(currentRot, angle, axisVector) {
    var radian = angle * (Math.PI / 180);
    var rotationToApply = quat.angleAxis(radian, axisVector);
    return rotationToApply.multiply(currentRot);
}

/**
 * Extracts the rotation angle (in degrees) from a quaternion along a single axis component.
 * Note: Accurate for single-axis rotations. Results may be imprecise for compound rotations.
 * @param {quat} quatValue - The quaternion to extract the angle from.
 * @param {string} axis - The axis component to use: "x", "y", or "z".
 * @returns {number} The angle in degrees.
 */
function getAngleOfQuat(quatValue, axis) {
    var radian = Math.asin(quatValue[axis]) * 2;
    return radian / Math.PI * 180;
}

/**
 * Extracts the total rotation angle (in degrees) from the W component of a quaternion.
 * Uses the half-angle formula: angle = acos(w) * 2.
 * @param {quat} quatValue - The quaternion to extract the angle from.
 * @returns {number} The total rotation angle in degrees.
 */
function getWAngleOfQuat(quatValue) {
    return Math.acos(quatValue.w) * 2 / Math.PI * 180;
}

// Exporting the functions
var exports = {
    lerp,
    clamp,
    remap,
    approxEqual,
    degreesToRadians,
    radiansToDegrees,
    rotateQuat,
    getAngleOfQuat,
    getWAngleOfQuat
};

if(script){
    script.exports = exports;
    if(!global.utils){ global.utils = {}; }
    Object.assign(global.utils, exports);
}else{
    module.exports = exports;
}