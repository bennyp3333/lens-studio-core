/**
 * Sets a default value for a specified key in an object if the key does not already exist.
 * @param {Object} obj - The object to check and possibly modify.
 * @param {string} key - The key to check in the object.
 * @param {*} def - The default value to set if the key does not exist.
 * @returns {*} The value of the key in the object, either the existing one or the default.
 */
function setDefault(obj, key, def) {
    var hasKey = Object.prototype.hasOwnProperty.call(obj, key);
    if (!hasKey) {
        obj[key] = def;
        return def;
    }
    return obj[key];
}

// Exporting the functions
var exports = {
    setDefault
};

if(script){
    script.exports = exports;
    if(!global.utils){ global.utils = {}; }
    Object.assign(global.utils, exports);
}else{
    module.exports = exports;
}