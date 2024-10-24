/**
 * Creates a multi-dimensional array of the specified length.
 * @param {Number} length - The length of the array.
 * @returns {Array} A new array, potentially multi-dimensional.
 */
function createArray(length) {
    var arr = new Array(length || 0),
        i = length;

    if (arguments.length > 1) {
        var args = Array.prototype.slice.call(arguments, 1);
        while (i--) arr[length - 1 - i] = createArray.apply(this, args);
    }

    return arr;
}

/**
 * Clones an array, creating a shallow copy.
 * @param {Array} array - The array to clone.
 * @returns {Array} A new array with the same elements as the original.
 */
function cloneArray(array) {
    var clonedArray = Array(array.length);

    for (i = 0; i < array.length; i++) {
        clonedArray[i] = array[i];
    }

    return clonedArray;
}

/**
 * Removes the first occurrence of a specified element from an array.
 * @param {Array} array - The array from which to remove the element.
 * @param {*} element - The element to be removed from the array.
 * @returns {boolean} `true` if the element was removed, `false` if the element was not found.
 */
function removeFromArray(array, element) {
    var index = array.indexOf(element);
    if (index > -1) {
        array.splice(index, 1);
        return true;
    }
    return false;
}

/**
 * Checks if an array includes a specific element.
 * @param {Array} array - The array to check.
 * @param {*} thing - The element to look for in the array.
 * @returns {Boolean} True if the element is found, false otherwise.
 */
function arrayIncludes(array, thing) {
    return (array.indexOf(thing) > -1);
}

/**
 * Removes duplicate elements from the array.
 * @param {Array} array - The array to process.
 * @returns {Array} A new array with duplicates removed.
 */
function arrayRemoveDuplicates(array) {
    return array.filter((item, index) => array.indexOf(item) === index);
}

/**
 * Randomly shuffles the elements of an array in place.
 * @param {Array} array - The array to shuffle.
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

/**
 * Finds the index of the maximum value in an array.
 * @param {Array} array - The array to search.
 * @returns {Number|null} The index of the maximum value or null if the array is empty.
 */
function indexOfMax(array) {
    if (array.length === 0) {
        return null;
    }

    var max = array[0];
    var maxIndex = 0;

    for (var i = 1; i < array.length; i++) {
        if (array[i] && array[i] > max) {
            maxIndex = i;
            max = array[i];
        }
    }

    return maxIndex;
}

/**
 * Retrieves the maximum value from an array.
 * @param {Array} array - The array to search.
 * @returns {*} The maximum value in the array.
 */
function getMax(array) {
    var maxIndex = indexOfMax(array);
    return array[maxIndex];
}

/**
 * Iterates over each element of the array and applies the provided function.
 * @param {Array} array - The array to iterate over.
 * @param {Function} fn - The function to apply to each element, receiving the element and its index.
 */
function forEach(array, fn) {
    if (array == null) {
        print("Array is null!");
        return;
    }

    for (var i = 0; i < array.length; i++) {
        fn(array[i], i);
    }
}

/**
 * Filters the array using the provided filter function.
 * @param {Array} array - The array to filter.
 * @param {Function} filterFn - The function to determine if an element should be included in the result.
 * @returns {Array} A new array containing the elements that passed the filter function.
 */
function filterArray(array, filterFn) {
    var ret = [];

    if (array == null) {
        print("Array is null!");
    } else {
        forEach(array, function compare(x, i) {
            if (filterFn(x)) {
                ret.push(x);
            }
        });
    }

    return ret;
}

// Exporting the functions
var exports = {
    createArray,
    cloneArray,
    removeFromArray,
    arrayIncludes,
    arrayRemoveDuplicates,
    shuffleArray,
    indexOfMax,
    getMax,
    forEach,
    filterArray
};

if(script){
    script.exports = exports;
    if(!global.utils){ global.utils = {}; }
    Object.assign(global.utils, exports);
}else{
    module.exports = exports;
}