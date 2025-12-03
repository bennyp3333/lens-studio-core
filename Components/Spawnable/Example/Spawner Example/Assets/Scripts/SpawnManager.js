// SpawnManager.js
// Version: 0.1.0
// Description: Global spawn utility for Lens Studio
// Author: Bennyp3333 [https://benjamin-p.dev]
//
// Usage:
//   global.spawn.create(prefabOrObj, parent, group)  - Spawn an object
//   global.spawn.get(id)                             - Get spawned object by ID
//   global.spawn.getGroup(groupName)                 - Get all objects in a group
//   global.spawn.destroy(id)                         - Destroy spawned object by ID
//   global.spawn.destroyGroup(groupName)             - Destroy all objects in a group
//   global.spawn.destroyAll()                        - Destroy all spawned objects
//   global.spawn.count(groupName)                    - Count objects (optionally in group)

//@ui {"widget":"separator"}
//@input bool debug
//@input string debugName = "SpawnManager" {"showIf":"debug"}
//@input Component.Text debugText {"showIf":"debug"}

// SPAWN REGISTRY

var spawnedObjects = {};      // id -> { obj, group, spawnableScript }
var spawnGroups = {};         // groupName -> [id, id, ...]
var idCounter = 0;

// CORE SPAWN FUNCTION

/**
 * Spawns an object from a prefab or by copying an existing scene object
 * @param {Asset.ObjectPrefab|SceneObject} source - Prefab asset or SceneObject to copy
 * @param {SceneObject} parent - Parent to spawn under
 * @param {string} [group] - Optional group name for organization
 * @returns {object} - { id, obj, script } or null if failed
 * 
 * NOTE FOR SCENE OBJECT COPIES:
 * - The source SceneObject should be DISABLED in the scene hierarchy
 * - Scripts on copied objects are only accessible AFTER the copy is enabled
 * - SpawnManager handles enabling automatically after copying
 */
function create(source, parent, group){
    if (!source) {
        errorPrint("Cannot spawn: source is null");
        return null;
    }
    
    if (!parent) {
        errorPrint("Cannot spawn: parent is null");
        return null;
    }

    var newObj = null;

    // Spawn based on type
    if (source.isOfType("Asset.ObjectPrefab")) {
        newObj = source.instantiate(parent);
        debugPrint("Instantiated Prefab: " + (newObj ? newObj.name : "null"));
    } else if (source.isOfType("SceneObject")) {
        if (source.enabled) {
            errorPrint("WARNING: Source SceneObject '" + source.name + "' is enabled. " +
                "Best practice is to keep reference objects DISABLED in the hierarchy.");
        }
        newObj = parent.copyWholeHierarchy(source);
        debugPrint("Copied SceneObject: " + (newObj ? newObj.name : "null"));
    } else {
        errorPrint("Cannot spawn: source is neither a Prefab nor a SceneObject");
        return null;
    }

    if (!newObj) {
        errorPrint("Spawn failed: resulting object is null");
        return null;
    }

    // Enable object
    newObj.enabled = true;

    // Generate unique ID
    var id = generateId();
    newObj.name = newObj.name + "_" + id;

    // Find SpawnableBase script on the object
    var spawnableScript = findSpawnableScript(newObj);

    // Initialize the spawnable if found
    if (spawnableScript) {
        spawnableScript.spawnId = id;
        spawnableScript.spawnGroup = group || null;
        spawnableScript.spawnManager = global.spawn;
        
        // Call onSpawned if it exists
        if (spawnableScript.onSpawned) {
            spawnableScript.onSpawned();
        }
    } else {
        errorPrint("Warning: No SpawnableBase script found on spawned object. " +
            "Add SpawnableBase.js to your prefab/object for full functionality.");
    }

    // Register in spawn registry
    var entry = {
        id: id,
        obj: newObj,
        group: group || null,
        script: spawnableScript
    };
    
    spawnedObjects[id] = entry;
    
    // Add to group if specified
    if (group) {
        if (!spawnGroups[group]) {
            spawnGroups[group] = [];
        }
        spawnGroups[group].push(id);
        debugPrint("Added to group '" + group + "': " + id);
    }
    
    debugPrint("Spawned object with ID: " + id);
    
    return entry;
}

// QUERY FUNCTIONS

/**
 * Get a spawned object by ID
 * @param {string} id - The spawn ID
 * @returns {object|null} - { id, obj, group, script } or null
 */
function get(id) {
    return spawnedObjects[id] || null;
}

/**
 * Get all spawned objects in a group
 * @param {string} groupName - The group name
 * @returns {object[]} - Array of { id, obj, group, script }
 */
function getGroup(groupName) {
    var ids = spawnGroups[groupName] || [];
    var result = [];
    
    for (var i = 0; i < ids.length; i++) {
        var entry = spawnedObjects[ids[i]];
        if (entry && entry.obj && !entry.obj.isDestroyed) {
            result.push(entry);
        }
    }
    
    return result;
}

/**
 * Get all spawned objects
 * @returns {object[]} - Array of { id, obj, group, script }
 */
function getAll() {
    var result = [];
    for (var id in spawnedObjects) {
        var entry = spawnedObjects[id];
        if (entry && entry.obj && !entry.obj.isDestroyed) {
            result.push(entry);
        }
    }
    return result;
}

/**
 * Count spawned objects, optionally filtered by group
 * @param {string} [groupName] - Optional group to count
 * @returns {number}
 */
function count(groupName) {
    if (groupName) {
        return getGroup(groupName).length;
    }
    return getAll().length;
}

// DESTROY FUNCTIONS

/**
 * Destroy a spawned object by ID
 * @param {string} id - The spawn ID
 * @returns {boolean} - True if destroyed
 */
function destroy(id) {
    var entry = spawnedObjects[id];
    if (!entry) {
        debugPrint("Cannot destroy: ID not found: " + id);
        return false;
    }
    
    // Call onDespawn if available
    if (entry.script && entry.script.onDespawn) {
        entry.script.onDespawn();
    }
    
    // Remove from group
    if (entry.group && spawnGroups[entry.group]) {
        var groupArray = spawnGroups[entry.group];
        var idx = groupArray.indexOf(id);
        if (idx > -1) {
            groupArray.splice(idx, 1);
        }
    }
    
    // Destroy the scene object
    if (entry.obj && !entry.obj.isDestroyed) {
        entry.obj.destroy();
    }
    
    // Remove from registry
    delete spawnedObjects[id];
    
    debugPrint("Destroyed: " + id);
    return true;
}

/**
 * Destroy all spawned objects in a group
 * @param {string} groupName - The group name
 * @returns {number} - Number of objects destroyed
 */
function destroyGroup(groupName) {
    var ids = spawnGroups[groupName] || [];
    var destroyed = 0;
    
    // Copy array since we're modifying it
    var idsCopy = ids.slice();
    
    for (var i = 0; i < idsCopy.length; i++) {
        if (destroy(idsCopy[i])) {
            destroyed++;
        }
    }
    
    // Clean up empty group
    delete spawnGroups[groupName];
    
    debugPrint("Destroyed group '" + groupName + "': " + destroyed + " objects");
    return destroyed;
}

/**
 * Destroy all spawned objects
 * @returns {number} - Number of objects destroyed
 */
function destroyAll() {
    var destroyed = 0;
    var allIds = Object.keys(spawnedObjects);
    
    for (var i = 0; i < allIds.length; i++) {
        if (destroy(allIds[i])) {
            destroyed++;
        }
    }
    
    debugPrint("Destroyed all: " + destroyed + " objects");
    return destroyed;
}

// UTILITY FUNCTIONS

/**
 * Generate a unique spawn ID
 */
function generateId() {
    idCounter++;
    var timestamp = Date.now().toString(36);
    var random = Math.random().toString(36).substring(2, 6);
    return "spawn_" + timestamp + "_" + random + "_" + idCounter;
}

/**
 * Find SpawnableBase script on an object (checks root and immediate children)
 */
function findSpawnableScript(obj) {
    // Check root object first
    var scriptComps = obj.getComponents("Component.ScriptComponent");
    for (var i = 0; i < scriptComps.length; i++) {
        var scriptComp = scriptComps[i];
        if (scriptComp && scriptComp.isSpawnable) {
            return scriptComp;
        }
    }
    
    // Check immediate children
    var childCount = obj.getChildrenCount();
    for (var c = 0; c < childCount; c++) {
        var child = obj.getChild(c);
        var scriptComps = child.getComponents("Component.ScriptComponent");
        for (var i = 0; i < scriptComps.length; i++) {
            var scriptComp = scriptComps[i];
            if (scriptComp && scriptComp.isSpawnable) {
                return scriptComp;
            }
        }
    }
    
    return null;
}

/**
 * Clean up destroyed objects from registry (call periodically if needed)
 */
function cleanup() {
    var cleaned = 0;
    
    for (var id in spawnedObjects) {
        var entry = spawnedObjects[id];
        if (!entry.obj || entry.obj.isDestroyed) {
            // Remove from group
            if (entry.group && spawnGroups[entry.group]) {
                var groupArray = spawnGroups[entry.group];
                var idx = groupArray.indexOf(id);
                if (idx > -1) {
                    groupArray.splice(idx, 1);
                }
            }
            delete spawnedObjects[id];
            cleaned++;
        }
    }
    
    if (cleaned > 0) {
        debugPrint("Cleaned up " + cleaned + " destroyed objects from registry");
    }
    
    return cleaned;
}

// INITIALIZATION

function init() {
    // Expose global API
    global.spawn = {
        create,
        get,
        getGroup,
        getAll,
        count,
        destroy,
        destroyGroup,
        destroyAll,
        cleanup
    };
    
    debugPrint("Initialized! API available at global.spawn");
}

init();

// DEBUG

function debugPrint(text) {
    if (!script.debug) return;
    var newLog = script.debugName + ": " + text;
    if (global.textLogger) global.logToScreen(newLog);
    if (script.debugText) script.debugText.text = newLog;
    print(newLog);
}

function errorPrint(text) {
    var errorLog = script.debugName + ": " + text;
    if (global.textLogger) global.logError(errorLog);
    if (script.debugText) script.debugText.text = errorLog;
    print(errorLog);
}