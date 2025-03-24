/**
 * Converts an RGB color to HSV color space.
 * @param {vec3|vec4} color - The color in RGB space. Can be a vec3 (r, g, b) or vec4 (r, g, b, a).
 * @returns {vec3|vec4} The color in HSV space. Returns a vec4 if the input had an alpha channel, preserving it.
 */
function rgbToHsv(color) {
    var r = color.r, g = color.g, b = color.b;
    
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var delta = max - min;
    
    var h = 0, s = 0, v = max;

    if (delta > 0) {
        if (max === r) {
            h = ((g - b) / delta) % 6;
        } else if (max === g) {
            h = ((b - r) / delta) + 2;
        } else {
            h = ((r - g) / delta) + 4;
        }

        h /= 6;
        if (h < 0) h += 1; // Normalize to [0,1]
    }

    s = max === 0 ? 0 : delta / max;
    
    if (color.w !== undefined) {
        return new vec4(h, s, v, color.a);
    } else {
        return new vec3(h, s, v);
    }
    
}

/**
 * Converts an HSV color to RGB color space.
 * @param {vec3|vec4} color - The color in HSV space. Can be a vec3 (h, s, v) or vec4 (h, s, v, a).
 * @returns {vec3|vec4} The color in RGB space. Returns a vec4 if the input had an alpha channel, preserving it.
 */
function hsvToRgb(color) {
    var h = color.x;
    var s = color.y;
    var v = color.z;

    var c = v * s;
    var hh = h * 6; // Range [0,6)
    var x = c * (1 - Math.abs(hh % 2 - 1));
    var m = v - c;

    var r = 0, g = 0, b = 0;

    if (hh < 1) { r = c; g = x; b = 0; }
    else if (hh < 2) { r = x; g = c; b = 0; }
    else if (hh < 3) { r = 0; g = c; b = x; }
    else if (hh < 4) { r = 0; g = x; b = c; }
    else if (hh < 5) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    
    if (color.w !== undefined) {
        return new vec4(r + m, g + m, b + m, color.a);
    } else {
        return new vec3(r + m, g + m, b + m);
    }
}

/**
 * Generates a random RGBA color.
 * @param {number|null} alpha - Optional alpha value. If undefined, alpha will be randomized between 0 and 1.
 * @returns {vec4} A random color in RGBA space.
 */
function colorRandom(alpha) {
    if(alpha == null){ alpha = Math.random(); }
    return new vec4(Math.random(), Math.random(), Math.random(), alpha);
}

/**
 * Generates a random RGB color with a random hue, specified brightness and saturation, and optional alpha.
 * @param {number} brightness - The brightness (value) of the color, in range [0, 1].
 * @param {number} saturation - The saturation of the color, in range [0, 1].
 * @param {number|null} alpha - Optional alpha value. If null or undefined, alpha defaults to 1.0.
 * @returns {vec4} A random color in RGB space with the specified alpha.
 */
function randomColorHue(brightness, saturation, alpha) {
    var hue = Math.random();
    if(alpha == null){ alpha = 1.0 }
    return hsvToRgb(new vec4(hue, saturation, brightness, alpha));
}

// Exporting the functions
var exports = {
    rgbToHsv,
    hsvToRgb,
    colorRandom,
    randomColorHue
};

if(script){
    script.exports = exports;
    if(!global.utils){ global.utils = {}; }
    Object.assign(global.utils, exports);
}else{
    module.exports = exports;
}