/**
 * Recursively searches for a SceneObject with the specified name in the tree
 * rooted at the given SceneObject. If no root is provided, it searches through 
 * all root objects in the scene.
 * @param {SceneObject | null} root - The root SceneObject from which to begin the search.
 * If null, the function will search through all root objects in the scene.
 * @param {string} name - The name of the SceneObject to search for.
 * @returns {SceneObject | null} The first SceneObject with the specified name if found,
 * or null if no such object exists in the tree.
 */
function findSceneObjectByName(root, name) {
    if (root === null) {
        const rootObjectCount = global.scene.getRootObjectsCount()
        let current = 0
        while (current < rootObjectCount) {
            const result = findSceneObjectByName(
                global.scene.getRootObject(current),
                name
            )
            if (result) {
                return result
            }
            current += 1
        }
    } else {
        if (root.name === name) {
            return root
        }

        for (let i = 0; i < root.getChildrenCount(); i++) {
            const child = root.getChild(i)
            const result = findSceneObjectByName(child, name)
            if (result) {
                return result
            }
        }
    }
    return null
}

/**
 * Recursively searches the children of a SceneObject and returns an array
 * of children that match a predicate function. If no root object is provided,
 * it searches through all root objects in the scene.
 * @param {SceneObject|null} object - The SceneObject to search through, or null to start at the root.
 * @param {function} predicate - A function that takes a SceneObject as an argument
 * and returns true if the object matches the criteria, false otherwise.
 * @returns {SceneObject[]} An array of SceneObjects that match the predicate.
 */
function searchByPredicate(object, predicate) {
    var matchingObjects = [];

    if (object === null) {
        const rootObjectCount = global.scene.getRootObjectsCount();
        for (let i = 0; i < rootObjectCount; i++) {
            const rootObject = global.scene.getRootObject(i);
            matchingObjects = matchingObjects.concat(searchByPredicate(rootObject, predicate));
        }
        return matchingObjects;
    }

    if (predicate(object)) {
        matchingObjects.push(object);
    }

    var childrenCount = object.getChildrenCount();
    for (var i = 0; i < childrenCount; i++) {
        var child = object.getChild(i);
        matchingObjects = matchingObjects.concat(searchByPredicate(child, predicate));
    }

    return matchingObjects;
}

/**
 * Checks if a SceneObject is a descendant of another.
 * @param {SceneObject} sceneObject - the potential descendant.
 * @param {SceneObject} root - the potential ascendant.
 * @returns {boolean} true, if sceneObject is a descendant of root,
 * otherwise, returns false.
 */
function isDescendantOf(sceneObject, root) {
    if (sceneObject === root) {
        return true
    }

    const parent = sceneObject.getParent()
    if (parent === null) {
        return false
    }

    return isDescendantOf(parent, root)
}

/**
 * Applies a function to all descendants of the root object.
 * @param {SceneObject} rootObject - The root of the tree to apply the function to.
 * @param {(SceneObject) => void} toApply - The function to apply to each scene object.
 * This function is called with each descendant of rootObject as an argument.
 * @returns {void}
 */
function applyToDescendants(rootObject, toApply) {
    for (const childObject of rootObject.children) {
        applyToDescendants(childObject, toApply)
    }
    toApply(rootObject)
}

/**
 * Finds a script on the given scene object that matches the specified property and filter function.
 * @param {Object} sceneObj - The scene object to search for the script component.
 * @param {string} [propName] - The property name to check in the script component. If omitted, no property check is performed.
 * @param {function} [filterFunc] - An optional function used to filter the script components. It should return `true` if the component matches.
 * @returns {Object|null} The first matching `ScriptComponent`, or `null` if no match is found.
 */
function findScript(sceneObj, propName, filterFunc) {
    var count = sceneObj.getComponentCount("Component.ScriptComponent");
    for (var i = 0; i < count; i++) {
        var component = sceneObj.getComponents("Component.ScriptComponent")[i];
        var scriptApi = component;
        if (propName && scriptApi[propName] === undefined) {
            continue;
        }
        if (filterFunc && !filterFunc(component)) {
            continue;
        }
        return component;
    }
    return null;
}

/**
 * Recursively searches upwards in the scene object hierarchy to find a script 
 * that matches the specified property and filter function.
 * @param {Object} sceneObj - The scene object to start the search from.
 * @param {string} [propName] - The property name to check in the script component. If omitted, no property check is performed.
 * @param {function} [filterFunc] - An optional function used to filter the script components.
 * @param {boolean} allowSelf - Whether to include `sceneObj` itself in the search.
 * @returns {Object|null} The first matching script found upwards in the hierarchy, or `null` if no match is found.
 */
function findScriptUpwards(sceneObj, propName, filterFunc, allowSelf) {
    if (allowSelf) {
        var res = findScript(sceneObj, propName, filterFunc);
        if (res) {
            return res;
        }
    }
    if (sceneObj.hasParent()) {
        return findScriptUpwards(sceneObj.getParent(), propName, filterFunc, true);
    }
    return null;
}

// Exporting the functions
var exports = {
    findSceneObjectByName,
    searchByPredicate,
    isDescendantOf,
    applyToDescendants,
    findScript,
    findScriptUpwards
};

if(script){
    script.exports = exports;
    if(!global.utils){ global.utils = {}; }
    Object.assign(global.utils, exports);
}else{
    module.exports = exports;
}