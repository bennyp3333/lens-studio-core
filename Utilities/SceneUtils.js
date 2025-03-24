/**
 * Recursively searches for a SceneObject with the specified name in the tree
 * rooted at the given SceneObject. If no root is provided, it searches through 
 * all root objects in the scene and returns the first match.
 * @param {SceneObject | null} root - The root SceneObject from which to begin the search.
 * If null, the function will search through all root objects in the scene.
 * @param {string} name - The name of the SceneObject to search for.
 * @returns {SceneObject | null} The first SceneObject with the specified name if found,
 * or null if no such object exists in the tree.
 */
function findFirstSceneObjectByName(root, name) {
    if (root == null) {
        var rootObjectCount = global.scene.getRootObjectsCount();
        for (var i = 0; i < rootObjectCount; i++) {
            var rootObject = global.scene.getRootObject(i);
            var result = findFirstSceneObjectByName(rootObject, name);
            if (result) {
                return result;
            }
        }
    } else {
        if (root.name == name) {
            return root;
        }

        for (var i = 0; i < root.getChildrenCount(); i++) {
            var child = root.getChild(i);
            var result = findFirstSceneObjectByName(child, name);
            if (result) {
                return result;
            }
        }
    }
    return null;
}

/**
 * Recursively searches for all SceneObjects with the specified name in the tree
 * rooted at the given SceneObject. If no root is provided, it searches through 
 * all root objects in the scene.
 * @param {SceneObject | null} root - The root SceneObject from which to begin the search.
 * If null, the function will search through all root objects in the scene.
 * @param {string} name - The name of the SceneObject to search for.
 * @returns {SceneObject[]} An array of SceneObjects with the specified name.
 */
function searchSceneObjectsByName(root, name) {
    var matchingObjects = [];

    if (root == null) {
        var rootObjectCount = global.scene.getRootObjectsCount();
        for (var i = 0; i < rootObjectCount; i++) {
            var rootObject = global.scene.getRootObject(i);
            matchingObjects = matchingObjects.concat(searchSceneObjectsByName(rootObject, name));
        }
        return matchingObjects;
    }

    if (root.name == name) {
        matchingObjects.push(root);
    }

    for (var i = 0; i < root.getChildrenCount(); i++) {
        var child = root.getChild(i);
        matchingObjects = matchingObjects.concat(searchSceneObjectsByName(child, name));
    }

    return matchingObjects;
}

/**
 * Recursively searches the children of a SceneObject and returns the first
 * SceneObject that matches a predicate function. If no root object is provided,
 * it searches through all root objects in the scene.
 * @param {SceneObject|null} object - The SceneObject to search through, or null to start at the root.
 * @param {function} predicate - A function that takes a SceneObject as an argument
 * and returns true if the object matches the criteria, false otherwise.
 * @returns {SceneObject | null} The first SceneObject that matches the predicate.
 */
function findFirstByPredicate(object, predicate) {
    if (object == null) {
        var rootObjectCount = global.scene.getRootObjectsCount();
        for (var i = 0; i < rootObjectCount; i++) {
            var rootObject = global.scene.getRootObject(i);
            var result = findFirstByPredicate(rootObject, predicate);
            if (result) {
                return result;
            }
        }
    } else {
        if (predicate(object)) {
            return object;
        }

        for (var i = 0; i < object.getChildrenCount(); i++) {
            var child = object.getChild(i);
            var result = findFirstByPredicate(child, predicate);
            if (result) {
                return result;
            }
        }
    }
    return null;
}

/**
 * Recursively searches the children of a SceneObject and returns an array
 * of SceneObjects that match a predicate function. If no root object is provided,
 * it searches through all root objects in the scene.
 * @param {SceneObject|null} object - The SceneObject to search through, or null to start at the root.
 * @param {function} predicate - A function that takes a SceneObject as an argument
 * and returns true if the object matches the criteria, false otherwise.
 * @returns {SceneObject[]} An array of SceneObjects that match the predicate.
 */
function searchByPredicate(object, predicate) {
    var matchingObjects = [];

    if (object == null) {
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

    for (var i = 0; i < object.getChildrenCount(); i++) {
        var child = object.getChild(i);
        matchingObjects = matchingObjects.concat(searchByPredicate(child, predicate));
    }

    return matchingObjects;
}

/**
 * Recursively searches for a component of the specified type in the tree
 * rooted at the given SceneObject. If no root is provided, it searches through 
 * all root objects in the scene and returns the first match.
 * @param {SceneObject | null} root - The root SceneObject from which to begin the search.
 * If null, the function will search through all root objects in the scene.
 * @param {string} componentType - The type of the component to search for (e.g., "Component.Camera").
 * @returns {Component | null} The first component of the specified type if found, 
 * or null if no such component exists in the tree.
 */
function findFirstComponentByType(root, componentType) {
    if (root == null) {
        var rootObjectCount = global.scene.getRootObjectsCount();
        for (var i = 0; i < rootObjectCount; i++) {
            var rootObject = global.scene.getRootObject(i);
            var result = findFirstComponentByType(rootObject, componentType);
            if (result) {
                return result;
            }
        }
    } else {
        var components = root.getComponents(componentType);
        if (components.length > 0) {
            return components[0]; // Return the first found component of the specified type.
        }

        for (var i = 0; i < root.getChildrenCount(); i++) {
            var child = root.getChild(i);
            var result = findFirstComponentByType(child, componentType);
            if (result) {
                return result;
            }
        }
    }
    return null;
}

/**
 * Recursively searches the children of a SceneObject and returns an array
 * of components that match the specified type. If no root object is provided,
 * it searches through all root objects in the scene.
 * @param {SceneObject | null} root - The root SceneObject to search through, or null to start at the root.
 * @param {string} componentType - The type of the component to search for (e.g., "Component.RenderMeshVisual").
 * @returns {Component[]} An array of components that match the specified type.
 */
function searchComponentsByType(root, componentType) {
    var matchingComponents = [];

    if (root == null) {
        var rootObjectCount = global.scene.getRootObjectsCount();
        for (var i = 0; i < rootObjectCount; i++) {
            var rootObject = global.scene.getRootObject(i);
            matchingComponents = matchingComponents.concat(searchComponentsByType(rootObject, componentType));
        }
        return matchingComponents;
    }

    var components = root.getComponents(componentType);
    if (components.length > 0) {
        matchingComponents = matchingComponents.concat(components);
    }

    for (var i = 0; i < root.getChildrenCount(); i++) {
        var child = root.getChild(i);
        matchingComponents = matchingComponents.concat(searchComponentsByType(child, componentType));
    }

    return matchingComponents;
}

/**
 * Checks if a SceneObject is a descendant of another.
 * @param {SceneObject} sceneObject - the potential descendant.
 * @param {SceneObject} root - the potential ascendant.
 * @returns {boolean} true, if sceneObject is a descendant of root,
 * otherwise, returns false.
 */
function isDescendantOf(sceneObject, root) {
    let current = sceneObject;
    while (current !== null) {
        if (current === root) {
            return true;
        }
        current = current.getParent();
    }
    return false;
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

/**
 * Recursively sets the alpha value for all supported visual components in the hierarchy of a root SceneObject.
 * @param {SceneObject} rootObj - The root object whose descendants will be affected.
 * @param {number} alpha - The alpha value to apply (between 0.0 and 1.0).
 * @param {boolean} effectDisabled - If true, alpha will still be applied to disabled objects. If false, disabled objects are skipped.
 * @returns {void}
 */
function recursiveAlpha(rootObj, alpha, effectDisabled){
    applyToDescendants(rootObj, (obj) => {
        if(!obj.enabled && !effectDisabled){ return; }
        
        var meshVisComp = obj.getComponent("Component.RenderMeshVisual");
        var imageComp = obj.getComponent("Component.Image");
        var text3DComp = obj.getComponent("Component.Text3D");
        var textComp = obj.getComponent("Component.Text");
        
        if(meshVisComp){
            for (var i = 0; i < meshVisComp.getMaterialsCount(); i++) {
                var currColor = meshVisComp.getMaterial(i).mainPass.baseColor;
                if(currColor){
                    currColor.a = alpha;
                    meshVisComp.getMaterial(i).mainPass.baseColor = currColor;
                }
            }
        }else if(imageComp){
            for (var i = 0; i < imageComp.getMaterialsCount(); i++) {
                var currColor = imageComp.getMaterial(i).mainPass.baseColor;
                if(currColor){
                    currColor.a = alpha;
                    imageComp.getMaterial(i).mainPass.baseColor = currColor;
                }
            }
        }else if(text3DComp){
            for (var i = 0; i < text3DComp.getMaterialsCount(); i++) {
                var currColor = text3DComp.getMaterial(i).mainPass.baseColor;
                if(currColor){
                    currColor.a = alpha;
                    text3DComp.getMaterial(i).mainPass.baseColor = currColor;
                }
            }
        }else if(textComp){
            var currColor = textComp.textFill.color;
            currColor.a = alpha;
            textComp.textFill.color = currColor;
        }
    });
}

// Exporting the functions
var exports = {
    findFirstSceneObjectByName,
    searchSceneObjectsByName,
    findFirstByPredicate,
    searchByPredicate,
    findFirstComponentByType,
    searchComponentsByType,
    isDescendantOf,
    applyToDescendants,
    findScript,
    findScriptUpwards,
    recursiveAlpha
};

if(script){
    script.exports = exports;
    if(!global.utils){ global.utils = {}; }
    Object.assign(global.utils, exports);
}else{
    module.exports = exports;
}