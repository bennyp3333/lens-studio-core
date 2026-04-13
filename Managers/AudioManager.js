/*
AudioManager.js
Version: 1.1.0
Description: Global audio manager for playing named audio tracks across scripts.
Author: Bennyp3333 [https://benjamin-p.dev]

==== Setup ====
1. Add this script to a SceneObject in your scene
2. Assign AudioTrackAssets in the inspector via the audioTracks list
3. Configure per-track options (volume, loop, fade, allowOverwrite, allowConcurrent)

==== Global API Usage ====
global.audioManager.play("trackName")                          - Play with track defaults
global.audioManager.play("trackName", function() { ... })      - Play; callback fires on complete
global.audioManager.play("trackName", { delay: 2.0 })          - Play after 2s delay
global.audioManager.play("trackName", { ... }, onComplete)     - Play with options + callback
global.audioManager.play(["a", "b"], { onComplete: fn })        - Play multiple; callback fires once (on "a")
global.audioManager.stop("trackName")                          - Stop (cancels pending delays)
global.audioManager.stop("trackName", { delay: 1.0 })          - Stop after delay
global.audioManager.stop("trackName", { fadeOutTime: 0.5 })    - Stop with custom fade
global.audioManager.pause("trackName")                         - Pause
global.audioManager.resume("trackName")                        - Resume
global.audioManager.isPlaying("trackName")                     - Returns true if currently playing

==== Options Object ====
All public methods accept an optional options object as the second argument:
{
    delay:           float     - Seconds before the action fires (all methods)
    loop:            bool      - Override track loop setting for this call (play)
    volume:          float     - Override track volume for this call (play)
    fadeInTime:      float     - Override fade-in duration, implies fade in (play)
    fadeOutTime:     float     - Override fade-out duration, implies fade out (play, stop)
    allowConcurrent: bool      - Override concurrent behaviour for this call (play)
    allowOverwrite:  bool      - Override overwrite behaviour for this call (play)
    onStart:         function  - Called when the sound actually starts, receives AudioComponent (play)
    onComplete:      function  - Called when the sound finishes, receives AudioComponent (play)
}

play() also accepts a function as the second argument as a shorthand for onComplete:
    global.audioManager.play("sfx", function(comp) { print("done"); });

For multi-name calls, onStart and onComplete only fire for the first track in the array.

==== Delay Management ====
Delayed calls are tracked internally per track. stop() and pause() always cancel pending
delays immediately — even when called with their own delay option, the cancellation happens
at call time (not when the delayed action fires). play() with allowOverwrite=true also
cancels pending delayed plays before restarting.

==== allowOverwrite / allowConcurrent ====
allowOverwrite=false, allowConcurrent=false: Skip if already playing
allowOverwrite=true,  allowConcurrent=false: Stop current, restart
allowConcurrent=true: Find a free AudioComponent or create a new one (concurrent play)
                      Each track starts with 1 dedicated AudioComponent; more are
                      created on demand and cached for reuse.
A paused AudioComponent is always treated as available regardless of allowOverwrite.

==== Naming ====
Track names must be unique. Duplicate names are rejected with a warning.
*/

/*
@typedef audioTrack
@property {string} trackName {"label": "Name"}
@property {Asset.AudioTrackAsset} track
@property {float} volume = 1.0
@property {bool} advanced = false
@ui {"widget":"group_start", "label":"Advanced", "showIf":"advanced"}
@property {bool} loop = false
@property {bool} fadeIn = false
@property {float} fadeInTime = 1.0 {"showIf":"fadeIn"}
@property {bool} fadeOut = false
@property {float} fadeOutTime = 1.0 {"showIf":"fadeOut"}
@property {bool} allowConcurrent = true
@property {bool} allowOverwrite = false {"showIf":"allowConcurrent", "showIfValue":"false"}
@ui {"widget":"group_end"}
*/

//@input audioTrack[] audioTracks
//@ui {"widget":"separator"}
//@input bool printDebugStatements = false
//@input bool printWarningStatements = true


// ============ AUDIOMANAGER CLASS ============

var AudioManager = function() {
    this._tracks = {};         // trackName -> trackConfig
    this._audioComps = {};     // trackName -> [AudioComponent] (per-track, grows with concurrent)
    this._pendingDelays = {};  // trackName -> [DelayedCallbackEvent]
};

AudioManager.prototype._addTrack = function(trackConfig) {
    var name = trackConfig.trackName;
    if (!name) {
        printWarning("Track has no name, skipping.");
        return;
    }
    if (!trackConfig.track) {
        printWarning("Track '" + name + "' has no AudioTrackAsset, skipping.");
        return;
    }
    if (this._tracks[name]) {
        printWarning("Track '" + name + "' already exists. Names must be unique — skipping duplicate.");
        return;
    }
    this._tracks[name] = trackConfig;
    this._audioComps[name] = [this._createComp(trackConfig)];
    this._pendingDelays[name] = [];
    printDebug("Added track: " + name);
};

AudioManager.prototype._createComp = function(trackConfig) {
    var comp = script.getSceneObject().createComponent("Component.AudioComponent");
    comp.audioTrack = trackConfig.track;
    comp.volume = trackConfig.volume !== undefined ? trackConfig.volume : 1.0;
    comp.fadeInTime  = trackConfig.fadeIn  ? (trackConfig.fadeInTime  || 0) : 0;
    comp.fadeOutTime = trackConfig.fadeOut ? (trackConfig.fadeOutTime || 0) : 0;
    return comp;
};

AudioManager.prototype._getFreeComp = function(name) {
    var comps = this._audioComps[name];
    // Prefer a fully idle comp first
    for (var i = 0; i < comps.length; i++) {
        if (!comps[i].isPlaying() && !comps[i].isPaused()) {
            return comps[i];
        }
    }
    // Fall back to a paused comp — stop it to clear the paused state and reuse it
    for (var i = 0; i < comps.length; i++) {
        if (comps[i].isPaused()) {
            comps[i].stop(false);
            return comps[i];
        }
    }
    // All actively playing — grow the pool (only called when allowConcurrent is true)
    var newComp = this._createComp(this._tracks[name]);
    comps.push(newComp);
    printDebug("Created extra AudioComponent for '" + name + "' (total: " + comps.length + ")");
    return newComp;
};

// Schedules a delayed call to a private method, forwarding options through.
// Both `name` and `options` are function parameters — safely captured per-call.
AudioManager.prototype._scheduleDelay = function(name, delay, options, method) {
    var self = this;
    var delayedEvent = script.createEvent("DelayedCallbackEvent");
    delayedEvent.bind(function() {
        self._removePendingDelay(name, delayedEvent);
        self[method](name, options);
    });
    delayedEvent.reset(delay);
    if (!this._pendingDelays[name]) this._pendingDelays[name] = [];
    this._pendingDelays[name].push(delayedEvent);
    return delayedEvent;
};

AudioManager.prototype._removePendingDelay = function(name, delayedEvent) {
    var list = this._pendingDelays[name];
    if (!list) return;
    var idx = list.indexOf(delayedEvent);
    if (idx !== -1) list.splice(idx, 1);
};

AudioManager.prototype._cancelPendingDelays = function(name) {
    var list = this._pendingDelays[name];
    if (!list || list.length === 0) return;
    for (var i = 0; i < list.length; i++) {
        script.removeEvent(list[i]);
    }
    this._pendingDelays[name] = [];
    printDebug("Cancelled " + list.length + " pending delay(s) for '" + name + "'");
};

AudioManager.prototype._play = function(name, options) {
    if (!this._tracks[name]) {
        printWarning("Track '" + name + "' not found.");
        return null;
    }
    var trackConfig = this._tracks[name];
    options = options || {};

    // Resolve per-call overrides, falling back to track config
    var allowConcurrent = options.allowConcurrent !== undefined ? options.allowConcurrent : trackConfig.allowConcurrent;
    var allowOverwrite  = options.allowOverwrite  !== undefined ? options.allowOverwrite  : trackConfig.allowOverwrite;
    var loop            = options.loop            !== undefined ? options.loop            : trackConfig.loop;
    var volume          = options.volume          !== undefined ? options.volume          : (trackConfig.volume !== undefined ? trackConfig.volume : 1.0);
    var fadeInTime      = options.fadeInTime      !== undefined ? options.fadeInTime      : (trackConfig.fadeIn  ? (trackConfig.fadeInTime  || 0) : 0);
    var fadeOutTime     = options.fadeOutTime     !== undefined ? options.fadeOutTime     : (trackConfig.fadeOut ? (trackConfig.fadeOutTime || 0) : 0);

    var comp;

    if (allowConcurrent) {
        comp = this._getFreeComp(name);
    } else {
        // allowOverwrite=true means this call is authoritative — cancel any pending delayed plays
        if (allowOverwrite) {
            this._cancelPendingDelays(name);
        }
        comp = this._audioComps[name][0];
        if (comp.isPlaying()) {
            if (allowOverwrite) {
                comp.stop(false);
            } else {
                printDebug("Skipping '" + name + "': already playing (allowOverwrite=false).");
                return null;
            }
        } else if (comp.isPaused()) {
            // Paused counts as available regardless of allowOverwrite — clear it and play fresh
            comp.stop(false);
        }
    }

    if (!comp) {
        printDebug("No free AudioComponent for '" + name + "' — all busy and allowConcurrent is false for this call.");
        return null;
    }

    // Apply per-call overrides to the comp before playing
    comp.volume      = volume;
    comp.fadeInTime  = fadeInTime;
    comp.fadeOutTime = fadeOutTime;

    // Wire up onComplete before play so setOnFinish is set on the exact comp being used.
    // Always call setOnFinish (even with null) to clear any stale callback from a previous play.
    var onComplete = options.onComplete || null;
    comp.setOnFinish(onComplete ? function() { onComplete(comp); } : null);

    if (options.onStart) options.onStart(comp);

    comp.play(loop ? -1 : 1);
    printDebug("Playing: " + name);
    return comp;
};

AudioManager.prototype._stop = function(name, options) {
    if (!this._audioComps[name]) {
        printWarning("Track '" + name + "' not found.");
        return [];
    }
    options = options || {};
    this._cancelPendingDelays(name);
    var comps = this._audioComps[name];
    var affected = [];
    for (var i = 0; i < comps.length; i++) {
        if (comps[i].isPlaying() || comps[i].isPaused()) {
            // Apply per-call fadeOutTime override if provided
            if (options.fadeOutTime !== undefined) {
                comps[i].fadeOutTime = options.fadeOutTime;
            }
            var fade = options.fadeOutTime !== undefined ? true : (this._tracks[name].fadeOut || false);
            comps[i].stop(fade);
            affected.push(comps[i]);
        }
    }
    return affected;
};

AudioManager.prototype._pause = function(name) {
    if (!this._audioComps[name]) {
        printWarning("Track '" + name + "' not found.");
        return [];
    }
    this._cancelPendingDelays(name);
    var comps = this._audioComps[name];
    var affected = [];
    for (var i = 0; i < comps.length; i++) {
        if (comps[i].isPlaying()) {
            comps[i].pause();
            affected.push(comps[i]);
        }
    }
    return affected;
};

AudioManager.prototype._resume = function(name) {
    if (!this._audioComps[name]) {
        printWarning("Track '" + name + "' not found.");
        return [];
    }
    var comps = this._audioComps[name];
    var affected = [];
    for (var i = 0; i < comps.length; i++) {
        if (comps[i].isPaused()) {
            comps[i].resume();
            affected.push(comps[i]);
        }
    }
    return affected;
};

// ============ PUBLIC API ============

/**
 * Registers one or more audio tracks with the manager. Each track gets its own
 * dedicated AudioComponent created on this SceneObject. Tracks must have unique names.
 *
 * Accepts a single track object or an array of track objects in the following format:
 * @example
 * global.audioManager.addTracks({
 *     trackName: "bubblePop",          // {string}  Unique name used to reference this track
 *     track:     script.myAudioAsset,  // {Asset.AudioTrackAsset} The audio asset to play
 *     volume:    1.0,                  // {number}  Volume multiplier (0-1), default 1.0
 *     loop:      false,                // {bool}    Loop forever (-1 loops), default false
 *     fadeIn:    false,                // {bool}    Apply fade in on play, default false
 *     fadeInTime: 0.5,                 // {number}  Fade in duration in seconds
 *     fadeOut:   false,                // {bool}    Apply fade out on stop, default false
 *     fadeOutTime: 0.5,                // {number}  Fade out duration in seconds
 *     allowOverwrite: false,           // {bool}    Stop and restart if already playing, default false
 *     allowConcurrent: true            // {bool}    Allow multiple simultaneous plays via pooling, default true
 * });
 *
 * @param {Object|Object[]} tracks - A single track config object or array of track config objects
 */
AudioManager.prototype.addTracks = function(tracks) {
    if (!tracks) return;
    if (tracks.length !== undefined && typeof tracks !== "string") {
        for (var i = 0; i < tracks.length; i++) this._addTrack(tracks[i]);
    } else {
        this._addTrack(tracks);
    }
};

/**
 * Removes one or more tracks from the manager. Cancels any pending delays and
 * destroys all associated AudioComponents for each track.
 * @param {string|string[]} names - Track name or array of track names to remove
 */
AudioManager.prototype.removeTracks = function(names) {
    if (!names) return;
    if (typeof names === "string") names = [names];
    for (var i = 0; i < names.length; i++) {
        var name = names[i];
        if (!this._audioComps[name]) continue;
        this._cancelPendingDelays(name);
        var comps = this._audioComps[name];
        for (var j = 0; j < comps.length; j++) comps[j].destroy();
        delete this._audioComps[name];
        delete this._pendingDelays[name];
        delete this._tracks[name];
        printDebug("Removed track: " + name);
    }
};

/**
 * Returns true if any AudioComponent for the named track is currently playing.
 * @param {string} name - Track name
 * @returns {bool}
 */
AudioManager.prototype.isPlaying = function(name) {
    var comps = this._audioComps[name];
    if (!comps) return false;
    for (var i = 0; i < comps.length; i++) {
        if (comps[i].isPlaying()) return true;
    }
    return false;
};

/**
 * Plays one or more tracks by name.
 * @param {string|string[]} name - Track name or array of track names
 * @param {Object|function} [options] - Options object, or a function used as onComplete shorthand
 * @param {function} [onComplete] - Called when the sound finishes; merged into options.onComplete
 * @returns {AudioComponent|AudioComponent[]|null} AudioComponent(s) that started playing,
 *          or null if delayed. For multiple names, returns an array. onStart/onComplete
 *          only fire for the first track when multiple names are passed.
 */
AudioManager.prototype.play = function(name, options, onComplete) {
    if (typeof options === "function") { onComplete = options; options = {}; }
    options = options || {};
    if (onComplete) options.onComplete = options.onComplete || onComplete;

    var names = (name.length !== undefined && typeof name !== "string") ? name : [name];
    var delay = options.delay || 0;

    // Build a muted copy of options without callbacks for all names after the first
    var mutedOptions = {};
    for (var key in options) {
        if (options.hasOwnProperty(key)) mutedOptions[key] = options[key];
    }
    delete mutedOptions.onStart;
    delete mutedOptions.onComplete;

    if (delay > 0) {
        for (var i = 0; i < names.length; i++) {
            if (!this._tracks[names[i]]) {
                printWarning("Track '" + names[i] + "' not found.");
                continue;
            }
            this._scheduleDelay(names[i], delay, i === 0 ? options : mutedOptions, "_play");
        }
        return null;
    }

    var results = [];
    for (var i = 0; i < names.length; i++) {
        results.push(this._play(names[i], i === 0 ? options : mutedOptions));
    }
    return results.length === 1 ? results[0] : results;
};

/**
 * Stops one or more tracks by name. Immediately cancels all pending delays for each track.
 * Respects each track's fadeOut setting unless overridden in options.
 * @param {string|string[]} name - Track name or array of track names
 * @param {Object} [options] - Options object
 * @param {number} [options.delay] - Seconds before stopping
 * @param {number} [options.fadeOutTime] - Override fade-out duration for this call
 * @returns {AudioComponent[]|null} Flat array of AudioComponents that were stopped, or null if delayed
 */
AudioManager.prototype.stop = function(name, options) {
    options = options || {};
    var names = (name.length !== undefined && typeof name !== "string") ? name : [name];
    var delay = options.delay || 0;

    if (delay > 0) {
        for (var i = 0; i < names.length; i++) {
            this._cancelPendingDelays(names[i]);
            this._scheduleDelay(names[i], delay, options, "_stop");
        }
        return null;
    }

    var results = [];
    for (var i = 0; i < names.length; i++) {
        var affected = this._stop(names[i], options);
        for (var j = 0; j < affected.length; j++) results.push(affected[j]);
    }
    return results;
};

/**
 * Pauses one or more tracks by name. Also cancels all pending delays for each track
 * so queued plays cannot fire and undo the pause.
 * @param {string|string[]} name - Track name or array of track names
 * @param {Object} [options] - Options object
 * @param {number} [options.delay] - Seconds before pausing
 * @returns {AudioComponent[]|null} Flat array of AudioComponents that were paused, or null if delayed
 */
AudioManager.prototype.pause = function(name, options) {
    options = options || {};
    var names = (name.length !== undefined && typeof name !== "string") ? name : [name];
    var delay = options.delay || 0;

    if (delay > 0) {
        for (var i = 0; i < names.length; i++) {
            this._cancelPendingDelays(names[i]);
            this._scheduleDelay(names[i], delay, options, "_pause");
        }
        return null;
    }

    var results = [];
    for (var i = 0; i < names.length; i++) {
        var affected = this._pause(names[i], options);
        for (var j = 0; j < affected.length; j++) results.push(affected[j]);
    }
    return results;
};

/**
 * Resumes one or more paused tracks by name.
 * @param {string|string[]} name - Track name or array of track names
 * @param {Object} [options] - Options object
 * @param {number} [options.delay] - Seconds before resuming
 * @returns {AudioComponent[]|null} Flat array of AudioComponents that were resumed, or null if delayed
 */
AudioManager.prototype.resume = function(name, options) {
    options = options || {};
    var names = (name.length !== undefined && typeof name !== "string") ? name : [name];
    var delay = options.delay || 0;

    if (delay > 0) {
        for (var i = 0; i < names.length; i++) {
            this._scheduleDelay(names[i], delay, options, "_resume");
        }
        return null;
    }

    var results = [];
    for (var i = 0; i < names.length; i++) {
        var affected = this._resume(names[i], options);
        for (var j = 0; j < affected.length; j++) results.push(affected[j]);
    }
    return results;
};

// ============ INITIALIZATION ============

function init() {
    global.audioManager = new AudioManager();
    if (script.audioTracks) {
        global.audioManager.addTracks(script.audioTracks);
    }
    printDebug("Initialized! API available at global.audioManager");
}

init();

// ============ DEBUG HELPERS ============

function printDebug(message) {
    if (script.printDebugStatements) {
        var log = "[AudioManager] " + message;
        if (global.textLogger) global.textLogger.log(log);
        print(log);
    }
}

function printWarning(message) {
    if (script.printWarningStatements) {
        var log = "[AudioManager] WARNING: " + message;
        if (global.textLogger) global.textLogger.log(log);
        print(log);
    }
}
