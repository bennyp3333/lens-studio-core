/*
AudioManager.js
Version: 1.0.0
Description: Global audio manager for playing named audio tracks across scripts.
Author: Bennyp3333 [https://benjamin-p.dev]

==== SETUP ====
1. Add this script to a SceneObject in your scene
2. Assign AudioTrackAssets in the inspector via the audioTracks list
3. Configure per-track options (volume, loop, fade, allowOverwrite, allowConcurrent)

==== GLOBAL API USAGE ====
global.audioManager.play("trackName")           - Play by name; returns AudioComponent
global.audioManager.play("trackName", 2.0)      - Play after 2s delay; returns null (comp unknown until fired)
global.audioManager.play(["a", "b"])             - Play multiple tracks; returns [AudioComponent, AudioComponent]
global.audioManager.stop("trackName")            - Stop; returns [AudioComponent] of stopped comps
global.audioManager.stop("trackName", 1.0)       - Stop after delay; returns null
global.audioManager.pause("trackName")           - Pause; returns [AudioComponent] of paused comps
global.audioManager.resume("trackName")          - Resume; returns [AudioComponent] of resumed comps

==== DELAY MANAGEMENT ====
Delayed calls are tracked internally per track. Calling stop() or pause() on a track
automatically cancels any pending delayed plays for that track. Calling play() with
allowOverwrite=true also cancels pending delayed plays before restarting.

==== allowOverwrite / allowConcurrent ====
allowOverwrite=false, allowConcurrent=false: Skip if already playing
allowOverwrite=true,  allowConcurrent=false: Stop current, restart
allowConcurrent=true: Find a free AudioComponent or create a new one (concurrent play)
                      Each track starts with 1 dedicated AudioComponent; more are
                      created on demand and cached for reuse.

==== NAMING ====
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


// ---- AudioManager ----

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
    // All actively playing — create a new one if concurrent is enabled
    if (this._tracks[name].allowConcurrent) {
        var newComp = this._createComp(this._tracks[name]);
        comps.push(newComp);
        printDebug("Created extra AudioComponent for '" + name + "' (total: " + comps.length + ")");
        return newComp;
    }
    return null;
};

// Schedules a delayed call to a private method by name. Both `name` and `method` are
// function parameters so they are safely captured per-call — no closure-in-loop issues.
AudioManager.prototype._scheduleDelay = function(name, delay, method) {
    var self = this;
    var delayedEvent = script.createEvent("DelayedCallbackEvent");
    delayedEvent.bind(function() {
        self._removePendingDelay(name, delayedEvent);
        self[method](name);
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

AudioManager.prototype._play = function(name) {
    if (!this._tracks[name]) {
        printWarning("Track '" + name + "' not found.");
        return null;
    }
    var trackConfig = this._tracks[name];
    var comp;

    if (trackConfig.allowConcurrent) {
        comp = this._getFreeComp(name);
    } else {
        // allowOverwrite=true means this call is authoritative — cancel any pending delayed plays
        if (trackConfig.allowOverwrite) {
            this._cancelPendingDelays(name);
        }
        comp = this._audioComps[name][0];
        if (comp.isPlaying()) {
            if (trackConfig.allowOverwrite) {
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

    if (!comp) return null;

    comp.play(trackConfig.loop ? -1 : 1);
    printDebug("Playing: " + name);
    return comp;
};

AudioManager.prototype._stop = function(name) {
    if (!this._audioComps[name]) {
        printWarning("Track '" + name + "' not found.");
        return [];
    }
    this._cancelPendingDelays(name);
    var comps = this._audioComps[name];
    var fade = this._tracks[name].fadeOut || false;
    var affected = [];
    for (var i = 0; i < comps.length; i++) {
        if (comps[i].isPlaying() || comps[i].isPaused()) {
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

// ---- Public API ----

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
 * Plays one or more tracks by name. Behaviour on a track that is already playing
 * is controlled by its allowOverwrite and allowConcurrent settings.
 * If allowOverwrite=true and allowConcurrent=false, also cancels any pending delayed plays.
 * @param {string|string[]} name - Track name or array of track names
 * @param {number} [delay] - Optional delay in seconds before playing
 * @returns {AudioComponent|AudioComponent[]|null} The AudioComponent that started playing,
 *          or an array when multiple names are given. Returns null if delayed (the specific
 *          AudioComponent is not known until the delay fires) or if the play was skipped.
 */
AudioManager.prototype.play = function(name, delay) {
    var names = (name.length !== undefined && typeof name !== "string") ? name : [name];
    if (delay && delay > 0) {
        for (var i = 0; i < names.length; i++) {
            if (!this._tracks[names[i]]) {
                printWarning("Track '" + names[i] + "' not found.");
                continue;
            }
            this._scheduleDelay(names[i], delay, "_play");
        }
        return null;
    }
    var results = [];
    for (var i = 0; i < names.length; i++) results.push(this._play(names[i]));
    return results.length === 1 ? results[0] : results;
};

/**
 * Stops one or more tracks by name. Immediately cancels all pending delays for
 * each track (including any queued delayed plays). Respects each track's fadeOut setting.
 * @param {string|string[]} name - Track name or array of track names
 * @param {number} [delay] - Optional delay in seconds before stopping
 * @returns {AudioComponent[]|null} Flat array of every AudioComponent that was stopped,
 *          or null if delayed. Useful for attaching setOnFinish callbacks after a manual stop.
 */
AudioManager.prototype.stop = function(name, delay) {
    var names = (name.length !== undefined && typeof name !== "string") ? name : [name];
    if (delay && delay > 0) {
        for (var i = 0; i < names.length; i++) {
            this._scheduleDelay(names[i], delay, "_stop");
        }
        return null;
    }
    var results = [];
    for (var i = 0; i < names.length; i++) {
        var affected = this._stop(names[i]);
        for (var j = 0; j < affected.length; j++) results.push(affected[j]);
    }
    return results;
};

/**
 * Pauses one or more tracks by name. Also cancels all pending delays for each track
 * so queued plays cannot fire and undo the pause.
 * @param {string|string[]} name - Track name or array of track names
 * @param {number} [delay] - Optional delay in seconds before pausing
 * @returns {AudioComponent[]|null} Flat array of every AudioComponent that was paused, or null if delayed.
 */
AudioManager.prototype.pause = function(name, delay) {
    var names = (name.length !== undefined && typeof name !== "string") ? name : [name];
    if (delay && delay > 0) {
        for (var i = 0; i < names.length; i++) {
            this._scheduleDelay(names[i], delay, "_pause");
        }
        return null;
    }
    var results = [];
    for (var i = 0; i < names.length; i++) {
        var affected = this._pause(names[i]);
        for (var j = 0; j < affected.length; j++) results.push(affected[j]);
    }
    return results;
};

/**
 * Resumes one or more paused tracks by name.
 * @param {string|string[]} name - Track name or array of track names
 * @param {number} [delay] - Optional delay in seconds before resuming
 * @returns {AudioComponent[]|null} Flat array of every AudioComponent that was resumed, or null if delayed.
 */
AudioManager.prototype.resume = function(name, delay) {
    var names = (name.length !== undefined && typeof name !== "string") ? name : [name];
    if (delay && delay > 0) {
        for (var i = 0; i < names.length; i++) {
            this._scheduleDelay(names[i], delay, "_resume");
        }
        return null;
    }
    var results = [];
    for (var i = 0; i < names.length; i++) {
        var affected = this._resume(names[i]);
        for (var j = 0; j < affected.length; j++) results.push(affected[j]);
    }
    return results;
};

// ---- Init ----

function init() {
    global.audioManager = new AudioManager();
    if (script.audioTracks) {
        global.audioManager.addTracks(script.audioTracks);
    }
    printDebug("Initialized! API available at global.audioManager");
}

init();

// ---- Debug Helpers ----

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
