/*
PrefabInjector.js
Version: 1.0.0
Description: Injects references forwarded out of a delay loaded prefab into another script's inputs,
    then enables it. Repairs a script whose inputs broke when its targets moved into a prefab,
    without editing that script at all.
Author: Bennyp3333 [https://benjamin-p.dev]

 ==== Why ====

PrefabForwarder gets references back out of a prefab, but reading them still means writing a
callback inside every script that needs them, plus a "ready" flag so the script does not run
against missing assets. That is fine for your own scripts and no help at all for one you would
rather not touch.

Drop this on the same object instead, map each Forward Name to a Target Input, and it writes them
in and enables the script. The target needs no changes and no internal gating.

 ==== Names ====

Three different names meet here, each defined in one place:

    Load Name      set on a DelayLoader entry       which prefab
    Forward Name   set on a PrefabForwarder entry   which reference inside that prefab
    Target Input   set on a row here                which input on the Target Script

Load Name on this component says which prefab the rows pull from. Load Name Override on a row
pulls just that row from a different prefab, leave it blank otherwise.

 ==== Leave the target script DISABLED ====

Untick the target script component in the Inspector. A script component that has never been
enabled has not run its body and has not fired OnStart, so enabling it after injection means it
starts up for the first time with correct values. That is the whole trick, and it is why no gating
is needed inside it.

Values written onto a script before its first enable survive that enable, so the target's body and
its OnStart both see the injected references, and it reads them like any other input. After
enabling, the injector writes them all again purely as a safeguard, Debug reports if that was ever
needed.

If the target is left enabled it has already initialised against broken inputs. Injection still
overwrites the inputs, which helps a script that reads them later at runtime, but anything it
captured during startup is already wrong. This script warns when it sees that.

 ==== Target Input must match exactly ====

An object input left empty reads as undefined, exactly like a name the target never declared, and
there is no way to list a script's inputs from out here. So a misspelled Target Input cannot be
detected, it just sets a property nothing reads. If a target wakes up with an input still empty,
check the spelling first.

 ==== Usage ====

 1. Move the heavy content into a prefab, add a PrefabForwarder to its root and give each
    reference the broken script needs a Forward Name.
 2. Add a DelayLoader entry for the prefab, and note its Load Name.
 3. Disable the broken script's component.
 4. Add PrefabInjector to the same object, set Target Script and Load Name, then add a row per
    reference. Leave Target Input blank when it matches the Forward Name.

    Target Script -> CarController
    Load Name     -> "car"
    Injections    -> [ wheels -> wheels ] [ wheels -> hints ] [ wiperAnim -> anim ]
                       Forward Name -> Target Input

    CarController wakes up once, with script.wheels, script.hints and script.anim populated.

 - Arrays come through as arrays, so an array input is restored by the same row. Tick "Is Array"
   on the matching PrefabForwarder entry.
 - A row's Load Name Override pulls it from a different prefab. Nothing is enabled until every
   prefab a row depends on has loaded.

 ==== API ====

    script.inject()         // inject now, against whatever has already loaded
    script.isInjected()     // bool
    script.onInjected       // sticky event, fires with { ok, injected, failed }

 ==== Notes ====

 - Needs a DelayLoader in the scene, it reads everything through global.delayLoader.
 - Subscribing is order independent. DelayLoader's load events are sticky, so a prefab that
   loaded before this script started still delivers.
 - With "Only Enable If All Succeeded" on, one bad row leaves the target untouched and disabled
   rather than running half wired. Read the log if a feature stays off.
 - Use "Objects To Enable" / "Components To Enable" when the target's object, visuals or siblings
   also need to stay off until the references arrive. Enabling a script component does nothing
   while its SceneObject is disabled.

*/

/**
@typedef Injection
@property {string} forwardName {"hint":"The Forward Name given to the reference on the prefab's PrefabForwarder"}
@property {string} targetInput {"hint":"The Target Script input to write into, spelled exactly as declared. Leave blank if it is the same as Forward Name"}
@property {string} loadNameOverride {"hint":"Leave blank to use Load Name above. Set it only when this reference comes from a different prefab"}
**/

//@input Component.ScriptComponent targetScript {"hint":"The script to fill in. Untick its component in the Inspector so it waits for injection"}
//@input string loadName {"hint":"Load Name of the DelayLoader entry these references come from"}
//@ui {"widget":"label", "label":"Each row: Forward Name -> Target Input"}
//@input Injection[] injections {"hint":"One row per reference to write into the Target Script"}

//@ui {"widget":"separator"}
//@input bool enableTarget = true {"hint":"Enable the Target Script once its inputs are written"}
//@input bool requireAll = true {"label":"Only Enable If All Succeeded", "hint":"If any row cannot be resolved, write nothing and enable nothing"}
//@input SceneObject[] objectsToEnable {"hint":"Also enabled after injection. Add the target's SceneObject here if it is disabled too"}
//@input Component[] componentsToEnable {"hint":"Also enabled after injection"}

//@ui {"widget":"separator"}
//@input bool debug
//@input string debugName = "" {"showIf":"debug"}
//@input Component.Text debugText {"showIf":"debug"}

var self = script.getSceneObject();

// ===== Event System =====

/**
 * Simple callback list. A sticky dispatcher remembers its last payload and replays it to anyone
 * who subscribes after it has already fired.
 * @param {boolean} [sticky] - Whether to replay the last payload to new subscribers
 */
function EventDispatcher(sticky) {
    this.callbacks = [];
    this.sticky = !!sticky;
    this.hasFired = false;
    this.lastPayload = null;
}

/**
 * Add a callback to this event.
 * @param {function} callback - Function to call when the event fires
 * @param {boolean} [skipReplay] - On a sticky event, do not replay the last payload
 */
EventDispatcher.prototype.add = function(callback, skipReplay) {
    if (typeof callback !== "function") {
        print("[PrefabInjector] Attempted to add non-function callback");
        return;
    }
    if (this.callbacks.indexOf(callback) === -1) {
        this.callbacks.push(callback);
    }
    if (this.sticky && this.hasFired && !skipReplay) {
        safeCall(callback, this.lastPayload);
    }
};

/**
 * Remove a callback from this event.
 * @param {function} callback - The callback to remove
 */
EventDispatcher.prototype.remove = function(callback) {
    var index = this.callbacks.indexOf(callback);
    if (index > -1) {
        this.callbacks.splice(index, 1);
    }
};

/**
 * Fire the event.
 * @param {Object} payload - Passed to every callback
 */
EventDispatcher.prototype.trigger = function(payload) {
    if (this.sticky) {
        this.hasFired = true;
        this.lastPayload = payload;
    }
    var callbacks = this.callbacks.slice();
    for (var i = 0; i < callbacks.length; i++) {
        safeCall(callbacks[i], payload);
    }
};

/**
 * Calls a callback, reporting rather than propagating anything it throws.
 * @param {function} callback - The callback to run
 * @param {Object} payload - Argument to pass along
 */
function safeCall(callback, payload) {
    try {
        callback(payload);
    } catch (e) {
        print("[PrefabInjector] Error in callback: " + e);
    }
}

// ===== State =====

var onInjectedEvent = new EventDispatcher(true);
var waiting = [];
var hasInjected = false;

// ===== Internal Functions =====

/**
 * The Load Name a row depends on. A blank Load Name Override falls back to the component's.
 * @param {Object} row - One injection row
 * @returns {string} The trimmed Load Name, or "" if neither is set
 */
function loadNameFor(row) {
    if (row.loadNameOverride && row.loadNameOverride.trim() !== "") {
        return row.loadNameOverride.trim();
    }
    return script.loadName ? script.loadName.trim() : "";
}

/**
 * The injection rows worth acting on, reporting the ones that are not.
 * @returns {Object[]} Rows with a usable name
 */
function usableRows() {
    var rows = [];
    if (!script.injections) return rows;

    for (var i = 0; i < script.injections.length; i++) {
        var row = script.injections[i];
        if (!row) continue;

        if (!row.forwardName || row.forwardName.trim() === "") {
            debugPrint("Skipping injection " + i + ", Forward Name is empty.", true);
            continue;
        }
        if (loadNameFor(row) === "") {
            debugPrint("Skipping injection '" + row.forwardName + "', no Load Name is set on the" +
                " component or the row's Load Name Override.", true);
            continue;
        }
        rows.push(row);
    }
    return rows;
}

/**
 * Every distinct Load Name the rows depend on.
 * @param {Object[]} rows - Usable injection rows
 * @returns {string[]} Distinct Load Names
 */
function loadNamesFor(rows) {
    var names = [];
    for (var i = 0; i < rows.length; i++) {
        var name = loadNameFor(rows[i]);
        if (names.indexOf(name) === -1) {
            names.push(name);
        }
    }
    return names;
}

/**
 * Looks up the value one row injects, without writing anything.
 * @param {Object} row - One injection row
 * @returns {Object|null} { name, key, value }, or null if the prefab is not loaded or nothing is
 *     forwarded under the row's Forward Name
 */
function resolveRow(row) {
    var loadName = loadNameFor(row);
    var payload = global.delayLoader.get(loadName);

    if (!payload) {
        debugPrint("Cannot inject '" + row.forwardName + "', '" + loadName + "' is not loaded.",
            true);
        return null;
    }

    // get() reports a missing name itself, and hands back whole arrays for an array entry
    var value = payload.get(row.forwardName);
    if (value === null || value === undefined) {
        return null;
    }

    var key = (row.targetInput && row.targetInput.trim() !== "")
        ? row.targetInput.trim()
        : row.forwardName;
    return { name: row.forwardName, key: key, value: value };
}

/**
 * Writes every resolved reference onto the target script.
 * @param {Object[]} pairs - Resolved { name, key, value } entries
 */
function writeAll(pairs) {
    for (var i = 0; i < pairs.length; i++) {
        script.targetScript[pairs[i].key] = pairs[i].value;
        debugPrint("Injected '" + pairs[i].name + "' into '" + pairs[i].key + "'.");
    }
}

/**
 * Writes every reference again once the target is enabled. Its body runs on that first enable and
 * OnStart runs later, so this guarantees OnStart sees the injected values even if the engine reset
 * the inputs to their Inspector values when the script initialised.
 * @param {Object[]} pairs - Resolved { name, key, value } entries
 */
function rewriteAfterEnable(pairs) {
    var reset = [];
    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i];
        if (isEmpty(script.targetScript[pair.key]) && !isEmpty(pair.value)) {
            reset.push(pair.key);
        }
        script.targetScript[pair.key] = pair.value;
    }

    if (reset.length > 0) {
        debugPrint("Enabling the target reset " + reset.join(", ") + " to the Inspector value," +
            " wrote it again. The target must read these in OnStart, not in its script body.");
    } else {
        debugPrint("Injected values were still in place after enabling the target.");
    }
}

/**
 * Whether a value holds nothing, the way an empty input reads.
 * @param {*} value - Value to test
 * @returns {boolean}
 */
function isEmpty(value) {
    if (value === null || value === undefined) return true;
    return Array.isArray(value) && value.length === 0;
}

/**
 * Enables the target script and anything else listed.
 */
function enableTargets() {
    if (script.enableTarget && script.targetScript) {
        script.targetScript.enabled = true;
        debugPrint("Enabled the target script.");
    }
    enableAll(script.objectsToEnable);
    enableAll(script.componentsToEnable);
}

/**
 * Enables every entry of a SceneObject or Component array input.
 * @param {Array} list - The array input, which may be null
 */
function enableAll(list) {
    if (!list) return;
    for (var i = 0; i < list.length; i++) {
        if (list[i]) {
            list[i].enabled = true;
        }
    }
}

/**
 * Called when one of the prefabs this component depends on has loaded.
 * @param {string} name - The load name that arrived
 */
function onLoaded(name) {
    var index = waiting.indexOf(name);
    if (index > -1) {
        waiting.splice(index, 1);
    }

    if (waiting.length > 0) {
        debugPrint("'" + name + "' loaded, still waiting on " + waiting.join(", ") + ".");
        return;
    }

    inject();
}

/**
 * Binds a load name to its handler, so the loop variable is not captured by reference.
 * @param {string} name - The load name
 * @returns {function} Handler for that name's load event
 */
function makeLoadedHandler(name) {
    return function() {
        onLoaded(name);
    };
}

// ===== Public API =====

// Marks this script as an injector for anyone looking for one
script.isPrefabInjector = true;

/**
 * Injects every row that can be resolved right now, then enables the target.
 * @returns {Object} A summary, { ok, injected, failed }
 */
function inject() {
    var result = { ok: false, injected: 0, failed: 0 };

    if (!global.delayLoader) {
        debugPrint("Cannot inject, global.delayLoader not found.", true);
        return result;
    }
    if (!script.targetScript) {
        debugPrint("Cannot inject, no target script is set.", true);
        return result;
    }

    // resolve everything before writing anything, so a failed row can leave the target untouched
    var rows = usableRows();
    var pairs = [];
    for (var i = 0; i < rows.length; i++) {
        var pair = resolveRow(rows[i]);
        if (pair) {
            pairs.push(pair);
        } else {
            result.failed++;
        }
    }

    result.ok = (result.failed === 0);
    hasInjected = true;

    if (!result.ok && script.requireAll) {
        debugPrint("Leaving everything untouched, " + result.failed + " of " + rows.length +
            " injection(s) failed and Only Enable If All Succeeded is on.", true);
    } else {
        writeAll(pairs);
        result.injected = pairs.length;
        enableTargets();
        if (script.enableTarget) {
            rewriteAfterEnable(pairs);
        }
    }

    debugPrint("Injected " + result.injected + ", failed " + result.failed + ".");
    onInjectedEvent.trigger(result);

    return result;
}

/**
 * @returns {boolean} Whether injection has run
 */
function isInjected() {
    return hasInjected;
}

script.inject = inject;
script.isInjected = isInjected;
script.onInjected = onInjectedEvent;

// ===== Init =====

function init() {
    if (!global.delayLoader) return;

    var rows = usableRows();
    if (rows.length === 0) {
        debugPrint("Nothing to inject.", true);
        return;
    }

    var names = loadNamesFor(rows);
    var registered = global.delayLoader.getNames();

    // waiting is counted down by onLoaded, so iterate the separate names list. A sticky load
    // event fires during add() when that prefab has already loaded, so that can happen in here.
    waiting = names.slice();

    for (var i = 0; i < names.length; i++) {
        var name = names[i];

        if (registered.indexOf(name) === -1) {
            debugPrint("No DelayLoader entry has the Load Name '" + name + "'," +
                " so nothing will ever be injected for it.", true);
        }

        global.delayLoader.onLoaded(name).add(makeLoadedHandler(name));
    }

    debugPrint("Initialized! Waiting on " + names.join(", ") + ".");
}

// Checked on awake so a misconfiguration is reported before anything has had a chance to run
if (!global.delayLoader) {
    debugPrint("global.delayLoader not found. Add a DelayLoader component to the scene.", true);
}
if (!script.targetScript) {
    debugPrint("No target script is set, there is nothing to inject into.", true);
} else if (script.enableTarget && script.targetScript.enabled) {
    debugPrint("The target script is already enabled, so it has already started up with its" +
        " broken inputs. Untick its component in the Inspector so it waits for injection.", true);
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
