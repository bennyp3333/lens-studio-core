/*
PrefabForwarder.js
Version: 2.0.0
Description: Forwards SceneObject and Component references out of a prefab so DelayLoader can hand
    them to callbacks once the prefab is instantiated. Place on the root of any delay loaded prefab.
Author: Bennyp3333 [https://benjamin-p.dev]

 ==== Usage ====

Moving a heavy object into a prefab breaks every //@-input pointing at it. Instead of searching the
scene by name after load, drop this script on the prefab root and list the things other scripts need.

 1. Add PrefabForwarder to the root object of the prefab.
 2. Add an entry to "Scene Objects To Forward" or "Components To Forward" for each reference you
    need outside the prefab, and give it a Forward Name.
 3. Read it back through DelayLoader by its Forward Name, or map it into a script's input with
    PrefabInjector:

    global.delayLoader.onLoaded("heroModel").add(function(loaded){
        loaded.get("heroAnim").playAnimation("idle");
    });

 - Forwarding a whole array

Tick "Is Array" on an entry and the single reference field is replaced by an array field. The whole
array comes back under the one name, so a script can restore its own input in a single assignment
instead of naming and fetching every element:

    global.delayLoader.onLoaded("car").add(function(loaded){
        script.wheels = loaded.get("wheels");
        script.hints = loaded.get("hints");
        carReady = true;
    });

 ==== API ====

    script.isPrefabForwarder        // true, marks this script as a forwarder
    script.getForwardedRefs()       // { forwardName: SceneObject|Component|Array, ... }

 ==== Notes ====

 - A Forward Name names one reference inside this prefab. The prefab itself is named by its Load
   Name on DelayLoader. See PrefabInjector.js for how the names fit together.
 - Forward Names only need to be unique within the prefab. A duplicate logs a warning and the
   first entry wins.
 - Entries with a blank Forward Name, or a blank single reference, are skipped.
 - An array entry always forwards an array, even when the input is empty, so a loop over it is
   always safe. It keeps its original length, empty slots included, so the indices still line up
   with what was listed in the inspector.
 - The forwarded array is a copy, so reassigning and then mutating it cannot disturb this prefab.
 - More than one forwarder can live on a prefab (root plus its immediate children). DelayLoader
   merges them all into one flat table.
 - DelayLoader finds this script by looking for the sceneObjectsToForward input rather than the
   isPrefabForwarder marker, so forwarding works no matter when this file's body runs.

*/

/**
@typedef SceneObjectToForward
@property {string} forwardName {"hint":"Name other scripts use to get this, with loaded.get() or as a PrefabInjector row's Forward Name. Unique within this prefab"}
@property {bool} isArray {"hint":"Forward a whole array under the one Forward Name"}
@property {SceneObject} sceneObject {"showIf":"isArray", "showIfValue":"false", "hint":"The object to forward"}
@property {SceneObject[]} sceneObjects {"showIf":"isArray", "hint":"The objects to forward, as one array"}
**/

/**
@typedef ComponentToForward
@property {string} forwardName {"hint":"Name other scripts use to get this, with loaded.get() or as a PrefabInjector row's Forward Name. Unique within this prefab"}
@property {bool} isArray {"hint":"Forward a whole array under the one Forward Name"}
@property {Component} component {"showIf":"isArray", "showIfValue":"false", "hint":"The component to forward"}
@property {Component[]} components {"showIf":"isArray", "hint":"The components to forward, as one array"}
**/

//@input SceneObjectToForward[] sceneObjectsToForward {"hint":"Objects inside this prefab that scripts outside it need"}
//@input ComponentToForward[] componentsToForward {"hint":"Components inside this prefab that scripts outside it need"}

//@ui {"widget":"separator"}
//@input bool debug
//@input string debugName = "" {"showIf":"debug"}
//@input Component.Text debugText {"showIf":"debug"}

var self = script.getSceneObject();

// ===== Public API =====

// Marks this script as a forwarder for anyone looking for one
script.isPrefabForwarder = true;

/**
 * Collects every valid forwarded reference into a single flat table. An entry with "Is Array"
 * ticked contributes one array under its name rather than one reference.
 * @returns {Object.<string, SceneObject|Component|SceneObject[]|Component[]>} Map of Forward Name to reference
 */
function getForwardedRefs() {
    var refs = {};

    collectRefs(script.sceneObjectsToForward, "sceneObject", "sceneObjects", refs);
    collectRefs(script.componentsToForward, "component", "components", refs);

    return refs;
}

script.getForwardedRefs = getForwardedRefs;

// ===== Internal Functions =====

/**
 * Reads one input array into the refs table, skipping and reporting invalid entries.
 * @param {Object[]} entries - Array of forward entries from the inspector
 * @param {string} singleKey - Property holding the reference when isArray is off
 * @param {string} arrayKey - Property holding the references when isArray is on
 * @param {Object.<string, SceneObject|Component|Array>} refs - Table to fill
 */
function collectRefs(entries, singleKey, arrayKey, refs) {
    if (!entries) return;

    for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        if (!entry) continue;

        var forwardName = entry.forwardName;
        if (!forwardName || forwardName.trim() === "") {
            debugPrint("Skipping forward entry " + i + ", Forward Name is empty.", true);
            continue;
        }

        if (refs[forwardName] !== undefined) {
            debugPrint("Duplicate Forward Name '" + forwardName + "', keeping the first one.",
                true);
            continue;
        }

        if (entry.isArray) {
            refs[forwardName] = readList(entry[arrayKey], forwardName);
        } else {
            var ref = entry[singleKey];
            if (!ref) {
                debugPrint("Skipping forward entry '" + forwardName + "', reference is empty.",
                    true);
                continue;
            }
            refs[forwardName] = ref;
        }
    }
}

/**
 * Turns one array input into the array that gets forwarded. Always returns an array, so a caller
 * can loop over it without checking, and always keeps its original length so that indices still
 * line up with the input that was listed in the inspector.
 * @param {Array} list - The raw array input, which may be null
 * @param {string} forwardName - Forward Name of the entry, for reporting
 * @returns {Array} A copy of the list
 */
function readList(list, forwardName) {
    if (!list || list.length === 0) {
        debugPrint("Forwarded array '" + forwardName + "' is empty.", true);
        return [];
    }

    var empty = 0;
    for (var i = 0; i < list.length; i++) {
        if (!list[i]) empty++;
    }
    if (empty > 0) {
        debugPrint("Forwarded array '" + forwardName + "' has " + empty +
            " empty slot(s). They are kept so the indices still line up.", true);
    }

    // copied so that whoever receives it cannot mutate this prefab's own input array
    return list.slice();
}

function init() {

    debugPrint("Initialized!");
}


script.createEvent("OnStartEvent").bind(init);

// Debug
function debugPrint(text, force) {
    if (!force && !script.debug) return;
    var newLog = "[" + (script.debugName || self.name) + "] " + text;
    if(global.textLogger) global.logToScreen(newLog);
    if(script.debugText) script.debugText.text = newLog;
    print(newLog);
}
