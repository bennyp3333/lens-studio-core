/*
SwipeDetector.js
Version: 1.0.0
Description: Generalized swipe detection with configurable thresholds and multiple event binding options.
Author: Bennyp3333 [https://benjamin-p.dev]

==== Usage ====
Attach this script to any Scene Object.
Provides three events: onSwipeStart, onSwipeUpdate, onSwipeEnd
Supports both programmatic callbacks and inspector-configured global/custom function callbacks.

==== Examples ====

// Programmatic event binding
script.swipeDetector.onSwipeEnd.add(function(data) {
    if (!data.isValid) return;
    print("Valid swipe! Direction: " + data.direction);
});

// Using in a game controller
script.swipeDetector.onSwipeEnd.add(function(data) {
    if (!data.isValid) return;
    var forceDirection = new vec3(data.direction.x, 0, data.direction.y);
    forceDirection = forceDirection.uniformScale(forceMultiplier);
    forceDirection.y = data.speed * hopForceMultiplier;
    puckController.shoot(forceDirection);
});

// Track swipe progress for visual feedback
script.swipeDetector.onSwipeUpdate.add(function(data) {
    updateSwipeIndicator(data.direction, data.distance);
});

==== API ====
- onSwipeStart.add(callback)    - Add callback for swipe start: { touchPos, time }
- onSwipeStart.remove(callback) - Remove callback from swipe start
- onSwipeUpdate.add(callback)   - Add callback for swipe update: { startPos, currentPos, direction, distance, elapsed }
- onSwipeUpdate.remove(callback)- Remove callback from swipe update
- onSwipeEnd.add(callback)      - Add callback for swipe end: { startPos, endPos, direction, distance, duration, speed, isValid }
- onSwipeEnd.remove(callback)   - Remove callback from swipe end
- setEnabled(bool)              - Enable/disable swipe detection
- isEnabled()                   - Check if swipe detection is enabled
- isSwiping()                   - Check if currently swiping
- resetSwipe()                  - Manually reset swipe state
*/

//@ui {"widget":"label", "label":"Swipe Detection Settings"}
//@input bool detectionEnabled = true {"label":"Enabled"}
//@input float maxSwipeTime = 0.5 {"label":"Max Swipe Time (s)", "hint":"Maximum duration for a valid swipe"}
//@input float minSwipeDistance = 0.1 {"label":"Min Swipe Distance", "hint":"Minimum distance for a valid swipe (screen units)"}

//@ui {"widget":"separator"}
//@ui {"widget":"label", "label":"Callbacks"}
//@input bool enableCallbacks = false {"label":"Enable Callbacks", "hint":"Toggle callback system"}
//@ui {"widget":"group_start", "label":"Callback Settings", "showIf":"enableCallbacks"}
//@input int callbackType = 0 {"widget":"combobox", "values":[{"label":"Global Function", "value":0}, {"label":"Custom Script", "value":1}], "hint":"Global function or custom script reference"}
//@input string onSwipeStartGlobalName {"label":"On Swipe Start", "showIf":"callbackType", "showIfValue":0, "hint":"Global function for swipe start"}
//@input string onSwipeUpdateGlobalName {"label":"On Swipe Update", "showIf":"callbackType", "showIfValue":0, "hint":"Global function for swipe update"}
//@input string onSwipeEndGlobalName {"label":"On Swipe End", "showIf":"callbackType", "showIfValue":0, "hint":"Global function for swipe end"}
//@input Component.ScriptComponent customScript {"label":"Custom Script", "showIf":"callbackType", "showIfValue":1, "hint":"Script component containing callback functions"}
//@input string onSwipeStartFunctionName {"label":"On Swipe Start", "showIf":"callbackType", "showIfValue":1, "hint":"Function name for swipe start"}
//@input string onSwipeUpdateFunctionName {"label":"On Swipe Update", "showIf":"callbackType", "showIfValue":1, "hint":"Function name for swipe update"}
//@input string onSwipeEndFunctionName {"label":"On Swipe End", "showIf":"callbackType", "showIfValue":1, "hint":"Function name for swipe end"}
//@ui {"widget":"group_end"}

//@ui {"widget":"separator"}
//@input bool advancedOptions = false
//@ui {"widget":"group_start", "label":"Advanced Options", "showIf":"advancedOptions"}
//@input bool touchBlockingEnabled = false
//@input bool trackUpdates = true {"hint":"Enable onSwipeUpdate events during swipe"}
//@input bool enableLogging = false
//@ui {"widget":"group_end"}

// ===== Component Setup =====
var sceneObject = script.getSceneObject();

// ===== Event System =====
function EventDispatcher() {
    this.callbacks = [];
}

EventDispatcher.prototype.add = function(callback) {
    if (typeof callback === 'function') {
        if (this.callbacks.indexOf(callback) === -1) {
            this.callbacks.push(callback);
        }
    } else {
        debugLog("WARNING: Attempted to add non-function callback", true);
    }
};

EventDispatcher.prototype.remove = function(callback) {
    var index = this.callbacks.indexOf(callback);
    if (index > -1) {
        this.callbacks.splice(index, 1);
    }
};

EventDispatcher.prototype.trigger = function(data) {
    for (var i = 0; i < this.callbacks.length; i++) {
        try {
            this.callbacks[i](data);
        } catch (e) {
            debugLog("WARNING: Error in callback: " + e, true);
        }
    }
};

EventDispatcher.prototype.hasCallbacks = function() {
    return this.callbacks.length > 0;
};

// ===== Event Dispatchers =====
var onSwipeStartEvent = new EventDispatcher();
var onSwipeUpdateEvent = new EventDispatcher();
var onSwipeEndEvent = new EventDispatcher();

// ===== Public API =====
script.onSwipeStart = onSwipeStartEvent;
script.onSwipeUpdate = onSwipeUpdateEvent;
script.onSwipeEnd = onSwipeEndEvent;

script.setEnabled = setEnabled;
script.isEnabled = isEnabled;
script.isSwiping = isSwiping;
script.resetSwipe = resetSwipe;

// ===== Internal State =====
var swipeActive = false;
var swipeStartTime = 0;
var startTouchPos = new vec2(0, 0);
var currentTouchPos = new vec2(0, 0);

// ===== Initialization =====
function init() {
    if (script.touchBlockingEnabled) {
        global.touchSystem.touchBlocking = true;
    }
    debugLog("Initialized");
}

init();

// ===== Touch Events =====
var touchStartEvent = script.createEvent("TouchStartEvent");
touchStartEvent.bind(function(eventData) {
    if (!script.detectionEnabled) { return; }

    swipeActive = true;
    swipeStartTime = getTime();
    startTouchPos = eventData.getTouchPosition();
    currentTouchPos = startTouchPos;
    
    debugLog("Swipe Started at: " + startTouchPos.x.toFixed(3) + ", " + startTouchPos.y.toFixed(3));
    
    var startData = {
        touchPos: startTouchPos,
        time: swipeStartTime
    };
    
    // Trigger programmatic callbacks
    onSwipeStartEvent.trigger(startData);
    
    // Trigger configured callbacks
    triggerCallback("start", startData);
});

var touchMoveEvent = script.createEvent("TouchMoveEvent");
touchMoveEvent.bind(function(eventData) {
    if (!script.detectionEnabled || !swipeActive || !script.trackUpdates) { return; }
    
    currentTouchPos = eventData.getTouchPosition();
    
    var direction = currentTouchPos.sub(startTouchPos);
    var distance = direction.length;
    var normalizedDirection = distance > 0 ? direction.normalize() : new vec2(0, 0);
    var elapsed = getTime() - swipeStartTime;
    
    var updateData = {
        startPos: startTouchPos,
        currentPos: currentTouchPos,
        direction: normalizedDirection,
        distance: distance,
        elapsed: elapsed
    };
    
    // Trigger programmatic callbacks
    onSwipeUpdateEvent.trigger(updateData);
    
    // Trigger configured callbacks
    triggerCallback("update", updateData);
});

var touchEndEvent = script.createEvent("TouchEndEvent");
touchEndEvent.bind(function(eventData) {
    if (!script.detectionEnabled || !swipeActive) { return; }
    
    swipeActive = false;
    
    var endTouchPos = eventData.getTouchPosition();
    var swipeEndTime = getTime();
    var swipeDuration = swipeEndTime - swipeStartTime;
    
    var direction = endTouchPos.sub(startTouchPos);
    var distance = direction.length;
    var normalizedDirection = distance > 0 ? direction.normalize() : new vec2(0, 0);
    var speed = swipeDuration > 0 ? distance / swipeDuration : 0;
    
    // Determine if swipe is valid based on thresholds
    var isValid = (swipeDuration <= script.maxSwipeTime) && (distance >= script.minSwipeDistance);
    
    debugLog("Swipe Ended - Duration: " + swipeDuration.toFixed(3) + "s, Distance: " + distance.toFixed(3) + ", Valid: " + isValid);
    
    var endData = {
        startPos: startTouchPos,
        endPos: endTouchPos,
        direction: normalizedDirection,
        distance: distance,
        duration: swipeDuration,
        speed: speed,
        isValid: isValid
    };
    
    // Trigger programmatic callbacks
    onSwipeEndEvent.trigger(endData);
    
    // Trigger configured callbacks
    triggerCallback("end", endData);
    
    // Reset positions
    startTouchPos = new vec2(0, 0);
    currentTouchPos = new vec2(0, 0);
});

// ===== Callback System =====
function triggerCallback(eventType, data) {
    if (!script.enableCallbacks) return;
    
    var globalName, customName;
    
    switch (eventType) {
        case "start":
            globalName = script.onSwipeStartGlobalName;
            customName = script.onSwipeStartFunctionName;
            break;
        case "update":
            globalName = script.onSwipeUpdateGlobalName;
            customName = script.onSwipeUpdateFunctionName;
            break;
        case "end":
            globalName = script.onSwipeEndGlobalName;
            customName = script.onSwipeEndFunctionName;
            break;
        default:
            return;
    }
    
    switch (script.callbackType) {
        case 0: // Global Function
            if (globalName && globalName.length > 0) {
                if (global[globalName]) {
                    global[globalName](data);
                } else {
                    debugLog("ERROR: Global function \"" + globalName + "\" not defined", true);
                }
            }
            break;
            
        case 1: // Custom Script
            if (customName && customName.length > 0) {
                if (script.customScript && script.customScript[customName]) {
                    script.customScript[customName](data);
                } else {
                    debugLog("ERROR: Custom function \"" + customName + "\" not defined", true);
                }
            }
            break;
    }
}

// ===== Control Functions =====
function setEnabled(bool) {
    script.detectionEnabled = bool;
    if (!bool && swipeActive) {
        resetSwipe();
    }
}

function isEnabled() {
    return script.detectionEnabled;
}

function isSwiping() {
    return swipeActive;
}

function resetSwipe() {
    swipeActive = false;
    swipeStartTime = 0;
    startTouchPos = new vec2(0, 0);
    currentTouchPos = new vec2(0, 0);
    debugLog("Swipe Reset");
}

// ===== Debug =====
function debugLog(message, force) {
    if (!force && !script.enableLogging) return;
    var newLog = "[SwipeDetector] " + message;
    if (global.textLogger) global.logToScreen(newLog);
    print(newLog);
}