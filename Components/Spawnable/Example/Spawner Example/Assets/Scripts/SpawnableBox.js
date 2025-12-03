//This is a modified copy of SpawnableBase.js, use that as a base for spawnable objects

//@ui {"widget":"separator"}
//@input bool debug
//@input string debugName = "Box" {"showIf":"debug"}
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
    script.despawnAfter(5);
};

/**
 * Called just before the object is destroyed via SpawnManager
 * Override this for cleanup logic
 */
script.onDespawn = function() {
    debugPrint("Despawning!");
};

script.setPosition = function(position){
    selfTransform.setWorldPosition(position);
}

// SELF-MANAGEMENT METHODS

/**
 * Destroy this spawned object (removes from SpawnManager registry)
 */
script.despawn = function() {
    if (script.spawnManager && script.spawnId) {
        script.spawnManager.destroy(script.spawnId);
    } else {
        // Fallback if not properly registered
        debugPrint("Warning: despawn called but not registered with SpawnManager", true);
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

function debugPrint(text, force) {
    if (!force && !script.debug) return;
    var idStr = script.spawnId ? " [" + script.spawnId + "]" : "";
    var log = script.debugName + idStr + ": " + text;
    if (global.textLogger) global.logToScreen(log);
    if (script.debugText) script.debugText.text = log;
    print(log);
}