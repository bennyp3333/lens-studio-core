// SpawnableBase.js
// Version: 0.1.0
// Description: Base script for spawnable objects in Lens Studio
//    Add this script to any object or prefab that will be spawned via SpawnManager
// Author: Bennyp3333 [https://benjamin-p.dev]
//
// IMPORTANT SETUP FOR SCENE OBJECT COPIES (not prefabs):
//   - The source SceneObject should be DISABLED in the hierarchy
//   - SpawnManager will enable the copy after spawning
//
// This script provides:
//   - Automatic ID assignment on spawn
//   - Group membership tracking
//   - Lifecycle callbacks (onSpawned, onDespawn)
//   - Self-destruction methods
//   - Access to spawn manager
//
// Override the callbacks by copying this script and modifying these functions:
//   script.onSpawned = function() { /* your code */ };
//   script.onDespawn = function() { /* your code */ };

//@ui {"widget":"label", "label":"Spawnable"}
//@ui {"widget":"separator"}
//@input bool debug
//@input string debugName = "Spawnable" {"showIf":"debug"}
//@input Component.Text debugText {"showIf":"debug"}

// SPAWNABLE IDENTITY

// Mark this script as a spawnable (used by SpawnManager to find it)
script.isSpawnable = true;

// These are set by SpawnManager when spawned
script.spawnId = null;
script.spawnGroup = null;
script.spawnManager = null;

var self = script.getSceneObject();
var selfTransform = self.getTransform();

// LIFECYCLE CALLBACKS (Override these)

/**
 * Called immediately after the object is spawned
 * Override this to run initialization logic
 */
script.onSpawned = function() {
    debugPrint("Spawned!");
};

/**
 * Called just before the object is destroyed via SpawnManager
 * Override this for cleanup logic
 */
script.onDespawn = function() {
    debugPrint("Despawning!");
};

// SELF-MANAGEMENT METHODS

/**
 * Destroy this spawned object (removes from SpawnManager registry)
 */
script.despawn = function() {
    if (script.spawnManager && script.spawnId) {
        script.spawnManager.destroy(script.spawnId);
    } else {
        // Fallback if not properly registered
        debugPrint("Warning: despawn called but not registered with SpawnManager");
        self.destroy();
    }
};

/**
 * Destroy this object after a delay
 * @param {number} delay - Delay in seconds
 */
script.despawnAfter = function(delay) {
    var delayedEvent = script.createEvent("DelayedCallbackEvent");
    delayedEvent.bind(function() {
        script.despawn();
    });
    delayedEvent.reset(delay);
};

/**
 * Get this object's spawn ID
 * @returns {string|null}
 */
script.getId = function() {
    return script.spawnId;
};

/**
 * Get this object's spawn group
 * @returns {string|null}
 */
script.getGroup = function() {
    return script.spawnGroup;
};

/**
 * Get the SceneObject this script is attached to
 * @returns {SceneObject}
 */
script.getObject = function() {
    return self;
};

// DEBUG

function debugPrint(text) {
    if (!script.debug) return;
    var idStr = script.spawnId ? " [" + script.spawnId + "]" : "";
    var newLog = script.debugName + idStr + ": " + text;
    if (global.textLogger) global.logToScreen(newLog);
    if (script.debugText) script.debugText.text = newLog;
    print(newLog);
}

function errorPrint(text) {
    var idStr = script.spawnId ? " [" + script.spawnId + "]" : "";
    var errorLog = "!!ERROR!! " + script.debugName + idStr + ": " + text;
    if (global.textLogger) global.logError(errorLog);
    if (script.debugText) script.debugText.text = errorLog;
    print(errorLog);
}