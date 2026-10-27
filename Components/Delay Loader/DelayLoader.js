/*
DelayLoader.js
Version: 2.0.0
Description: Keeps heavy content out of the scene until after the first frame, to pass Snap's LAT
    (Latency Activation Time) check. Instantiates prefabs under a chosen parent after a frame or
    time delay, or on demand, and hands back the references forwarded from inside them.
Author: Bennyp3333 [https://benjamin-p.dev]

 ==== Why ====

LAT is measured from lens start to the first rendered frame. Anything in the scene at that point
costs you - shader compilation, mesh upload, texture decode. Move the heavy parts of the lens into
prefabs, list them here, and they get instantiated one frame later instead, after the clock stops.

 ==== READ THIS FIRST, OR THIS SCRIPT WILL DO NOTHING FOR LAT ====

Deferring instantiation is only half the job. By default a prefab's ASSETS still load at lens
start, whether or not you ever instantiate it, so LAT does not move.

    Select each prefab in the Asset Browser and turn ON "Lazy Loading" in the Inspector.

    "On Lens Start"     loads the prefab's contents when the Lens opens, regardless of use
    "Lazy Load Assets"  loads them just before instantiating            <-- you want this

The setting is serialized as `LazyLoading: true` in the .prefab file, so you can grep for it.
It is OFF by default on every new prefab.

With Lazy Loading on, the asset load moves into instantiate(), which then blocks for as long as
that load takes. Tick "Async" on those entries so it goes through instantiateAsync and the queue
instead, spreading the work over several frames rather than stalling one.

Turn on Debug below to see each load's duration. If a genuinely heavy prefab reports ~0ms, its
assets were already resident, which means Lazy Loading is still off.

 ==== Usage ====

Add this script to the scene and access it with:

global.delayLoader

 - Loading on init

    Add an entry to the "Objects" array, give it a Load Name, set a prefab and a parent, tick
    "Load On Init". The prefab is instantiated directly under that parent after the delay, keeping
    the local transform it was authored with. Everything else refers to it by its Load Name.

 - Reacting to a load

    global.delayLoader.onLoaded("heroModel").add(function(loaded){
        loaded.root.getTransform().setLocalPosition(new vec3(0, 10, 0));
        loaded.get("heroAnim").playAnimation("idle");
    });

    Subscribing late is safe. If the object has already loaded the callback fires immediately with
    the existing payload, so script order never matters.

 - Loading manually

    Untick "Load On Init" and call it yourself:

    global.delayLoader.loadObject("heroModel", function(loaded){
        loaded.root.enabled = true;
    });

 - Getting references out of a prefab

    Put PrefabForwarder.js on the prefab root and give each object and component other scripts
    need a Forward Name. They arrive on the payload as `loaded.refs` / `loaded.get(forwardName)`.
    PrefabInjector.js can write them straight into another script's inputs instead, see its
    header for how Load Name, Forward Name and Target Input fit together.

    An entry with "Is Array" ticked forwards a whole array under one name, so a script can restore
    its own array input in one assignment:

    global.delayLoader.onLoaded("car").add(function(loaded){
        script.wheels = loaded.get("wheels");
        carReady = true;
    });

 ==== API ====

 - Loading

    global.delayLoader.loadObject(loadName, onComplete)  // or pass {parent, async, onComplete}
    global.delayLoader.loadAll(onComplete)               // loads every entry not already loaded
    global.delayLoader.unload(loadName)                  // destroys the instance
    global.delayLoader.reload(loadName, onComplete)      // unload then load again

 - Querying

    global.delayLoader.isLoaded(loadName)                // bool
    global.delayLoader.get(loadName)                     // payload, or null
    global.delayLoader.getRef(loadName, forwardName)     // forwarded reference, or null
    global.delayLoader.getNames()                        // every registered Load Name

 - Events

    global.delayLoader.onLoaded(loadName)                // per object, sticky
    global.delayLoader.onUnloaded(loadName)              // per object
    global.delayLoader.onAnyLoaded                   // fires for every load
    global.delayLoader.onAllLoaded                   // fires once, when all init loads settle

    Each is an event with .add(callback) and .remove(callback). Sticky events replay their last
    payload to new subscribers, pass true as a second argument to .add() to skip that.

 - The loaded payload

    loaded.name              // the entry's Load Name
    loaded.root              // the instantiated prefab root
    loaded.transform         // its Transform
    loaded.parent            // what it was instantiated under
    loaded.prefab            // the source prefab asset
    loaded.refs              // { forwardName: ref|Array, ... } from PrefabForwarder
    loaded.get(forwardName)  // one forwarded reference (whole array for an array entry), or null

 ==== Notes ====

 - Any number of DelayLoader components can exist. They all share one global.delayLoader, so keep
   a loader next to each heavy part of the lens instead of one giant list. Load Names must be
   unique across the whole scene, a duplicate is ignored and warns.
 - Load Names are registered when the component wakes, before any OnStartEvent, so another script
   can call loadObject on the very first frame.
 - Async entries use instantiateAsync and are queued, only one runs at a time. That spreads the
   work out instead of trading a load time hitch for a frame time one.
 - A frame delay of 1 loads on the second update, which is what you want for LAT. A delay of 0
   loads during OnStartEvent, which defeats the point, it is there only if you want it.
 - Objects are instantiated directly under their parent and never reparented, so the prefab's
   authored local transform survives. Tick "Reset Transform" to zero it instead.
 - If a load fails, onComplete is called with null.
 - unload() destroys the objects, but the prefab keeps its assets in memory if that prefab has
   "Retain Assets" ticked (`RetainAssets: true`, the default). Untick it if you unload to free
   memory rather than just to clear the screen.

*/

/**
@typedef ObjectToLoad
@property {string} loadName {"hint":"Unique name for this prefab. Used by global.delayLoader.loadObject and onLoaded, and as a PrefabInjector's Load Name"}
@property {Asset.ObjectPrefab} prefab {"hint":"Prefab to instantiate. Turn on Lazy Loading on it, or its assets still load at lens start"}
@property {SceneObject} parent {"hint":"Instantiated under this object. Leave empty to use this object"}
@property {bool} loadOnInit = false {"hint":"Load automatically after the delay below. Off means load it from script with loadObject"}
//@ui {"widget":"group_start", "label":"Load Delay", "showIf":"loadOnInit"}
@property {string} delayType = frames {"widget":"combobox", "values":[{"label":"frames", "value":"frames"}, {"label":"time", "value":"time"}], "hint":"Wait a number of frames or a number of seconds"}
@property {int} frameDelay = 1 {"showIf":"delayType", "showIfValue":"frames", "hint":"1 loads on the second update, which is what LAT wants. 0 loads during OnStart, which defeats the point"}
@property {float} timeDelay = 0.25 {"showIf":"delayType", "showIfValue":"time", "hint":"Seconds to wait before loading"}
//@ui {"widget":"group_end"}
@property {bool} async = false {"hint":"Load with instantiateAsync, queued one at a time. Use it with Lazy Loading so the asset load is spread over several frames"}
@property {bool} enableOnLoad = true {"hint":"Enable the prefab root once it is instantiated"}
@property {bool} resetTransform = false {"hint":"Zero the root's local transform instead of keeping the one the prefab was authored with"}
**/

//@input ObjectToLoad[] objects {"hint":"One entry per prefab to load"}

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
        print("[DelayLoader] Attempted to add non-function callback");
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
 * Forget the last payload so a sticky event stops replaying it.
 */
EventDispatcher.prototype.clear = function() {
    this.hasFired = false;
    this.lastPayload = null;
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
        print("[DelayLoader] Error in callback: " + e);
    }
}

// ===== Delay Helpers =====

/**
 * Runs a callback after a number of frames. A count of 0 or less runs it right away.
 * @param {ScriptComponent} ownerScript - Script the event lives on
 * @param {number} frames - Frames to wait
 * @param {function} callback - Function to run
 */
function delayFrames(ownerScript, frames, callback) {
    if (!frames || frames <= 0) {
        callback();
        return;
    }
    var counter = 0;
    var frameEvent = ownerScript.createEvent("UpdateEvent");
    frameEvent.bind(function() {
        if (counter >= frames) {
            frameEvent.enabled = false;
            ownerScript.removeEvent(frameEvent);
            callback();
            return;
        }
        counter++;
    });
}

/**
 * Runs a callback after a number of seconds. A time of 0 or less runs it right away.
 * @param {ScriptComponent} ownerScript - Script the event lives on
 * @param {number} seconds - Seconds to wait
 * @param {function} callback - Function to run
 */
function delayTime(ownerScript, seconds, callback) {
    if (!seconds || seconds <= 0) {
        callback();
        return;
    }
    var delayedEvent = ownerScript.createEvent("DelayedCallbackEvent");
    delayedEvent.bind(callback);
    delayedEvent.reset(seconds);
}

// ===== Reference Forwarding =====

/**
 * Reads the forwarded references off one PrefabForwarder script component.
 * Falls back to reading its inputs directly, since inputs are populated when a component is
 * created but the script's body may not have run yet on a freshly instantiated prefab.
 * @param {ScriptComponent} scriptComp - A script component holding forwarder inputs
 * @returns {Object.<string, SceneObject|Component|Array>} Map of Forward Name to reference
 */
function readForwarder(scriptComp) {
    if (typeof scriptComp.getForwardedRefs === "function") {
        return scriptComp.getForwardedRefs();
    }

    var refs = {};
    readForwarderArray(scriptComp.sceneObjectsToForward, "sceneObject", "sceneObjects", refs);
    readForwarderArray(scriptComp.componentsToForward, "component", "components", refs);
    return refs;
}

/**
 * Reads one forwarder input array into a refs table. Mirrors PrefabForwarder's own collectRefs,
 * quietly, for the case where that script's body has not run yet. Keep the two in step.
 * @param {Object[]} entries - Array of forward entries
 * @param {string} singleKey - Property holding the reference when isArray is off
 * @param {string} arrayKey - Property holding the references when isArray is on
 * @param {Object.<string, SceneObject|Component|Array>} refs - Table to fill
 */
function readForwarderArray(entries, singleKey, arrayKey, refs) {
    if (!entries) return;
    for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        if (!entry || !entry.forwardName) continue;
        if (refs[entry.forwardName] !== undefined) continue;

        if (entry.isArray) {
            var list = entry[arrayKey];
            refs[entry.forwardName] = list ? list.slice() : [];
        } else {
            if (!entry[singleKey]) continue;
            refs[entry.forwardName] = entry[singleKey];
        }
    }
}

/**
 * Checks whether a script component looks like a PrefabForwarder. Tests for the input rather than
 * the isPrefabForwarder marker so it works before the forwarder's body has run.
 * @param {ScriptComponent} scriptComp - Component to test
 * @returns {boolean}
 */
function isForwarder(scriptComp) {
    return !!scriptComp && typeof scriptComp.sceneObjectsToForward !== "undefined";
}

/**
 * Gathers forwarded references from every forwarder on an object and its immediate children.
 * @param {SceneObject} root - The instantiated prefab root
 * @param {function} log - Debug print to report duplicates through
 * @returns {Object.<string, SceneObject|Component>} Merged map of Forward Name to reference
 */
function collectForwardedRefs(root, log) {
    var refs = {};

    mergeForwardersOn(root, refs, log);
    for (var i = 0; i < root.getChildrenCount(); i++) {
        mergeForwardersOn(root.getChild(i), refs, log);
    }

    return refs;
}

/**
 * Merges every forwarder found on one object into the refs table.
 * @param {SceneObject} sceneObject - Object to search
 * @param {Object.<string, SceneObject|Component>} refs - Table to fill
 * @param {function} log - Debug print to report duplicates through
 */
function mergeForwardersOn(sceneObject, refs, log) {
    var scriptComps = sceneObject.getComponents("Component.ScriptComponent");
    for (var i = 0; i < scriptComps.length; i++) {
        if (!isForwarder(scriptComps[i])) continue;

        var found = readForwarder(scriptComps[i]);
        for (var name in found) {
            if (refs[name] !== undefined) {
                log("Duplicate Forward Name '" + name + "', keeping the first one.", true);
                continue;
            }
            refs[name] = found[name];
        }
    }
}

// ===== Registry =====

/**
 * The shared registry behind global.delayLoader. Holds every entry from every DelayLoader
 * component in the scene.
 */
function DelayLoaderRegistry() {
    this.entries = {};
    this.order = [];
    this.loadedEvents = {};
    this.unloadedEvents = {};
    this.onAnyLoaded = new EventDispatcher(false);
    this.onAllLoaded = new EventDispatcher(true);

    this.initCount = 0;
    this.initSettled = 0;
    this.allLoadedChecked = false;

    this.asyncQueue = [];
    this.asyncBusy = false;

    // replaced by the debug print of the first component that has debug turned on
    this.defaultLog = function(text, force) {
        if (force) print("[DelayLoader] " + text);
    };
}

// --- Registration ---

/**
 * Adds one entry to the registry. Called by each DelayLoader component as it wakes.
 * @param {Object} entry - Entry description built from the inspector
 * @returns {boolean} True if it was registered
 */
DelayLoaderRegistry.prototype.register = function(entry) {
    if (this.entries[entry.name]) {
        entry.log("Load Name '" + entry.name + "' is already registered, ignoring the duplicate.", true);
        return false;
    }

    entry.state = "idle";
    entry.loaded = null;
    entry.pending = [];
    entry.initSettled = false;

    this.entries[entry.name] = entry;
    this.order.push(entry.name);

    if (entry.loadOnInit && !this.onAllLoaded.hasFired) {
        this.initCount++;
    }

    return true;
};

/**
 * Schedules the delayed load for an entry that loads on init.
 * @param {Object} entry - A registered entry
 */
DelayLoaderRegistry.prototype.scheduleInitLoad = function(entry) {
    var registry = this;
    var run = function() {
        registry.loadObject(entry.name);
    };

    if (entry.delayType === "time") {
        entry.log("Scheduling '" + entry.name + "' in " + entry.timeDelay + "s.");
        delayTime(entry.ownerScript, entry.timeDelay, run);
    } else {
        entry.log("Scheduling '" + entry.name + "' in " + entry.frameDelay + " frame(s).");
        delayFrames(entry.ownerScript, entry.frameDelay, run);
    }
};

// --- Loading ---

/**
 * Loads a registered object.
 * @param {string} loadName - The entry's Load Name
 * @param {function|Object} [options] - onComplete callback, or { parent, async, onComplete }
 * @param {SceneObject} [options.parent] - Override the parent for this load
 * @param {boolean} [options.async] - Override async for this load
 * @param {function} [options.onComplete] - Called with the payload, or null if the load failed
 */
DelayLoaderRegistry.prototype.loadObject = function(loadName, options) {
    if (typeof options === "function") {
        options = { onComplete: options };
    }
    options = options || {};
    var onComplete = options.onComplete;

    var entry = this.entries[loadName];
    if (!entry) {
        this.defaultLog("Cannot load '" + loadName + "', no entry has that Load Name.", true);
        if (onComplete) onComplete(null);
        return;
    }

    var name = entry.name;

    if (entry.state === "loaded") {
        entry.log("'" + name + "' is already loaded, handing back the existing one.");
        if (onComplete) onComplete(entry.loaded);
        return;
    }

    if (onComplete) entry.pending.push(onComplete);

    if (entry.state === "loading") {
        entry.log("'" + name + "' is already loading, waiting on it.");
        return;
    }

    if (!entry.prefab) {
        this._failLoad(entry, "no prefab is set");
        return;
    }

    entry.state = "loading";

    var parent = options.parent || entry.parent;
    if (!parent) {
        parent = entry.ownerScript.getSceneObject();
        entry.log("'" + name + "' has no parent set, loading under " + parent.name + ".", true);
    }

    var useAsync = (options.async !== undefined) ? options.async : entry.async;

    if (useAsync) {
        this._enqueueAsync(entry, parent);
    } else {
        entry.log("Instantiating '" + name + "' under " + parent.name + ".");
        entry.loadStartTime = getTime();
        this._finishLoad(entry, entry.prefab.instantiate(parent), parent);
    }
};

/**
 * Loads every registered object that is not already loaded.
 * @param {function} [onComplete] - Called once, after the last one settles
 */
DelayLoaderRegistry.prototype.loadAll = function(onComplete) {
    var names = [];
    for (var i = 0; i < this.order.length; i++) {
        var entry = this.entries[this.order[i]];
        if (entry.state !== "loaded") {
            names.push(entry.name);
        }
    }

    if (names.length === 0) {
        if (onComplete) onComplete(null);
        return;
    }

    var remaining = names.length;
    var done = function() {
        remaining--;
        if (remaining <= 0 && onComplete) onComplete(null);
    };

    for (var j = 0; j < names.length; j++) {
        this.loadObject(names[j], done);
    }
};

/**
 * Destroys a loaded object and clears its references.
 * @param {string} loadName - The entry's Load Name
 * @returns {boolean} True if something was unloaded
 */
DelayLoaderRegistry.prototype.unload = function(loadName) {
    var entry = this.entries[loadName];
    if (!entry) {
        this.defaultLog("Cannot unload '" + loadName + "', no entry has that Load Name.", true);
        return false;
    }
    if (entry.state !== "loaded") {
        entry.log("Cannot unload '" + loadName + "', it is not loaded.", true);
        return false;
    }

    var payload = entry.loaded;
    entry.loaded = null;
    entry.state = "idle";

    // stop the sticky load event replaying an object that no longer exists
    this.onLoaded(loadName).clear();

    if (payload.root) {
        payload.root.destroy();
    }

    entry.log("Unloaded '" + loadName + "'.");

    this.onUnloaded(loadName).trigger(payload);

    return true;
};

/**
 * Unloads an object if it is loaded, then loads it again.
 * @param {string} loadName - The entry's Load Name
 * @param {function|Object} [options] - Same as loadObject
 */
DelayLoaderRegistry.prototype.reload = function(loadName, options) {
    if (this.isLoaded(loadName)) {
        this.unload(loadName);
    }
    this.loadObject(loadName, options);
};

// --- Querying ---

/**
 * @param {string} loadName - The entry's Load Name
 * @returns {boolean} Whether the object is currently loaded
 */
DelayLoaderRegistry.prototype.isLoaded = function(loadName) {
    var entry = this.entries[loadName];
    return !!entry && entry.state === "loaded";
};

/**
 * @param {string} loadName - The entry's Load Name
 * @returns {Object|null} The loaded payload, or null
 */
DelayLoaderRegistry.prototype.get = function(loadName) {
    var entry = this.entries[loadName];
    return (entry && entry.loaded) ? entry.loaded : null;
};

/**
 * @param {string} loadName - The entry's Load Name
 * @param {string} forwardName - Forward Name given to the reference in PrefabForwarder
 * @returns {SceneObject|Component|null} The forwarded reference, or null
 */
DelayLoaderRegistry.prototype.getRef = function(loadName, forwardName) {
    var payload = this.get(loadName);
    return payload ? payload.get(forwardName) : null;
};

/**
 * @returns {string[]} Every registered Load Name, in registration order
 */
DelayLoaderRegistry.prototype.getNames = function() {
    return this.order.slice();
};

// --- Events ---

/**
 * The event fired when an object finishes loading. Sticky, so subscribing after the fact still
 * calls you back with the payload.
 * @param {string} loadName - The entry's Load Name
 * @returns {EventDispatcher}
 */
DelayLoaderRegistry.prototype.onLoaded = function(loadName) {
    if (!this.loadedEvents[loadName]) {
        this.loadedEvents[loadName] = new EventDispatcher(true);
    }
    return this.loadedEvents[loadName];
};

/**
 * The event fired when an object is unloaded.
 * @param {string} loadName - The entry's Load Name
 * @returns {EventDispatcher}
 */
DelayLoaderRegistry.prototype.onUnloaded = function(loadName) {
    if (!this.unloadedEvents[loadName]) {
        this.unloadedEvents[loadName] = new EventDispatcher(false);
    }
    return this.unloadedEvents[loadName];
};

// --- Internal ---

/**
 * Queues an async load. Only one instantiateAsync runs at a time.
 * @param {Object} entry - The entry to load
 * @param {SceneObject} parent - Parent to instantiate under
 */
DelayLoaderRegistry.prototype._enqueueAsync = function(entry, parent) {
    this.asyncQueue.push({ entry: entry, parent: parent });
    this._pumpAsync();
};

/**
 * Starts the next queued async load if nothing is in flight.
 */
DelayLoaderRegistry.prototype._pumpAsync = function() {
    if (this.asyncBusy || this.asyncQueue.length === 0) return;

    var registry = this;
    var job = this.asyncQueue.shift();
    var entry = job.entry;

    this.asyncBusy = true;
    entry.log("Instantiating '" + entry.name + "' async under " + job.parent.name + ".");
    // timed from when the job actually starts, not when it was queued
    entry.loadStartTime = getTime();

    try {
        entry.prefab.instantiateAsync(job.parent,
            function(root) {
                registry._finishLoad(entry, root, job.parent);
                registry._asyncDone();
            },
            function(error) {
                registry._failLoad(entry, "instantiateAsync failed, " + error);
                registry._asyncDone();
            },
            function(progress) {});
    } catch (e) {
        // never leave the queue stalled, everything behind this one would silently never load
        this._failLoad(entry, "instantiateAsync threw, " + e);
        this._asyncDone();
    }
};

/**
 * Marks the in flight async load as finished and starts the next one.
 */
DelayLoaderRegistry.prototype._asyncDone = function() {
    this.asyncBusy = false;
    this._pumpAsync();
};

/**
 * Sets up a freshly instantiated object, builds its payload and fires the load events.
 * @param {Object} entry - The entry being loaded
 * @param {SceneObject} root - The instantiated prefab root
 * @param {SceneObject} parent - What it was instantiated under
 */
DelayLoaderRegistry.prototype._finishLoad = function(entry, root, parent) {
    if (!root) {
        this._failLoad(entry, "the instantiated object is null");
        return;
    }

    var transform = root.getTransform();

    if (entry.resetTransform) {
        transform.setLocalPosition(vec3.zero());
        transform.setLocalRotation(quat.quatIdentity());
        transform.setLocalScale(vec3.one());
    }

    root.enabled = entry.enableOnLoad;

    var refs = collectForwardedRefs(root, entry.log);
    var payload = {
        name: entry.name,
        root: root,
        transform: transform,
        parent: parent,
        prefab: entry.prefab,
        refs: refs,
        get: function(forwardName) {
            if (refs[forwardName] === undefined) {
                entry.log("'" + entry.name + "' has no Forward Name '" + forwardName +
                    "', check its PrefabForwarder.", true);
                return null;
            }
            return refs[forwardName];
        }
    };

    entry.loaded = payload;
    entry.state = "loaded";

    // a heavy prefab reporting ~0ms means its assets were already resident, ie Lazy Loading is off
    var took = entry.loadStartTime != null
        ? " in " + Math.round((getTime() - entry.loadStartTime) * 1000) + "ms"
        : "";
    entry.log("Loaded '" + entry.name + "'" + took +
        " with " + Object.keys(refs).length + " forwarded reference(s).");

    this._flushPending(entry, payload);

    // through the accessor, so the sticky event exists to hold the payload even with no subscribers
    this.onLoaded(entry.name).trigger(payload);
    this.onAnyLoaded.trigger(payload);

    this._settleInit(entry);
};

/**
 * Reports a failed load and releases anything waiting on it.
 * @param {Object} entry - The entry that failed
 * @param {string} reason - Why it failed
 */
DelayLoaderRegistry.prototype._failLoad = function(entry, reason) {
    entry.state = "idle";
    entry.log("Failed to load '" + entry.name + "', " + reason + ".", true);
    this._flushPending(entry, null);
    this._settleInit(entry);
};

/**
 * Calls and clears the callbacks waiting on an in flight load.
 * @param {Object} entry - The entry that settled
 * @param {Object|null} payload - The payload, or null if the load failed
 */
DelayLoaderRegistry.prototype._flushPending = function(entry, payload) {
    var pending = entry.pending;
    entry.pending = [];
    for (var i = 0; i < pending.length; i++) {
        safeCall(pending[i], payload);
    }
};

/**
 * Counts an init load as settled and fires onAllLoaded once they all are.
 * @param {Object} entry - The entry that settled
 */
DelayLoaderRegistry.prototype._settleInit = function(entry) {
    if (!entry.loadOnInit || entry.initSettled) return;
    entry.initSettled = true;
    this.initSettled++;
    this._checkAllLoaded();
};

/**
 * Fires onAllLoaded if every init load has settled and it has not fired yet.
 */
DelayLoaderRegistry.prototype._checkAllLoaded = function() {
    if (this.onAllLoaded.hasFired) return;
    if (this.initSettled < this.initCount) return;
    this.defaultLog("All init loads settled.");
    this.onAllLoaded.trigger(null);
};

/**
 * Arranges the one deferred onAllLoaded check, which covers the case of no init loads at all.
 * @param {ScriptComponent} ownerScript - Script the event lives on
 */
DelayLoaderRegistry.prototype.scheduleAllLoadedCheck = function(ownerScript) {
    if (this.allLoadedChecked) return;
    this.allLoadedChecked = true;

    var registry = this;
    delayFrames(ownerScript, 1, function() {
        registry._checkAllLoaded();
    });
};

// ===== Component =====

if (!global.delayLoader) {
    global.delayLoader = new DelayLoaderRegistry();
}
var registry = global.delayLoader;
if (script.debug) {
    registry.defaultLog = debugPrint;
}

/**
 * Registers this component's entries. Runs on awake so every name exists before any OnStartEvent.
 */
function registerObjects() {
    if (!script.objects) return;

    for (var i = 0; i < script.objects.length; i++) {
        var object = script.objects[i];

        if (!object.loadName || object.loadName.trim() === "") {
            debugPrint("Skipping object " + i + ", Load Name is empty.", true);
            continue;
        }
        if (!object.prefab) {
            debugPrint("Skipping object '" + object.loadName + "', no prefab is set.", true);
            continue;
        }

        registry.register({
            name: object.loadName,
            prefab: object.prefab,
            parent: object.parent,
            loadOnInit: object.loadOnInit,
            delayType: object.delayType,
            frameDelay: object.frameDelay,
            timeDelay: object.timeDelay,
            async: object.async,
            enableOnLoad: object.enableOnLoad,
            resetTransform: object.resetTransform,
            ownerScript: script,
            log: debugPrint
        });
    }
}

function init() {
    if (script.objects) {
        for (var i = 0; i < script.objects.length; i++) {
            var entry = registry.entries[script.objects[i].loadName];
            // only schedule entries this component owns, a duplicate name belongs to someone else
            if (entry && entry.loadOnInit && entry.ownerScript.isSame(script)) {
                registry.scheduleInitLoad(entry);
            }
        }
    }

    registry.scheduleAllLoadedCheck(script);

    debugPrint("Initialized!");
}

registerObjects();

script.createEvent("OnStartEvent").bind(init);

// ===== Public API =====

script.loadObject = function(loadName, options) { return registry.loadObject(loadName, options); };
script.loadAll = function(onComplete) { return registry.loadAll(onComplete); };
script.unload = function(loadName) { return registry.unload(loadName); };
script.reload = function(loadName, options) { return registry.reload(loadName, options); };
script.isLoaded = function(loadName) { return registry.isLoaded(loadName); };
script.get = function(loadName) { return registry.get(loadName); };
script.getRef = function(loadName, forwardName) { return registry.getRef(loadName, forwardName); };
script.getNames = function() { return registry.getNames(); };
script.onLoaded = function(loadName) { return registry.onLoaded(loadName); };
script.onUnloaded = function(loadName) { return registry.onUnloaded(loadName); };
script.onAnyLoaded = registry.onAnyLoaded;
script.onAllLoaded = registry.onAllLoaded;

// Debug
function debugPrint(text, force) {
    if (!force && !script.debug) return;
    var newLog = "[" + (script.debugName || self.name) + "] " + text;
    if(global.textLogger) global.logToScreen(newLog);
    if(script.debugText) script.debugText.text = newLog;
    print(newLog);
}
