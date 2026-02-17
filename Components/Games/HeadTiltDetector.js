/*
HeadTiltDetector.js
Version: 1.0.0
Description: Generalized head tilt detection with configurable thresholds and event binding options.
Author: Bennyp3333 [https://benjamin-p.dev]

==== Usage ====
Attach this script to any Scene Object.
Provides two events: onTiltUpdate, onTiltDecision
Supports both programmatic callbacks and inspector-configured global/custom function callbacks.

==== Examples ====

// Programmatic event binding - track tilt values
script.headTiltDetector.onTiltUpdate.add(function(data) {
    print("Normalized: " + data.normalized.toFixed(2) + " | Raw: " + data.raw.toFixed(2));
    // data.normalized ranges from -1 (full left) to 1 (full right)
    // based on commitThreshold - useful for visual feedback
    updateTiltIndicator(data.normalized);
});

// Programmatic event binding - respond to decisions
script.headTiltDetector.onTiltDecision.add(function(data) {
    print("Decision: " + (data.isRight ? "RIGHT" : "LEFT"));
    selectOption(data.isRight ? 0 : 1);
});

// Use confidence for visual feedback before decision commits
script.headTiltDetector.onTiltUpdate.add(function(data) {
    if (data.pendingDirection !== 0) {
        showPendingIndicator(data.pendingDirection, data.confidence);
    }
});

==== API ====
- onTiltUpdate.add(callback)      - Add callback for tilt updates: { raw, smoothed, normalized, velocity, pendingDirection, confidence }
- onTiltUpdate.remove(callback)   - Remove callback from tilt updates
- onTiltDecision.add(callback)    - Add callback for decisions: { isRight, direction, confidence }
- onTiltDecision.remove(callback) - Remove callback from decisions
- setEnabled(bool)                - Enable/disable tilt detection
- isEnabled()                     - Check if tilt detection is enabled
- getSmoothedTilt()               - Get current smoothed tilt value (-1 to 1)
- getRawTilt()                    - Get current raw tilt value
- getPendingDirection()           - Get pending direction (-1, 0, 1)
- getConfidence()                 - Get current decision confidence (0 to 1)
- resetState()                    - Manually reset tilt state
*/

//@ui {"widget":"label", "label":"Head Tilt Detection Settings"}
//@input Component.Head head {"label":"Head Component"}
//@input bool detectionEnabled = true {"label":"Enabled"}

//@ui {"widget":"separator"}
//@ui {"widget":"label", "label":"Thresholds"}
//@input float activationThreshold = 0.2 {"label":"Activation Threshold", "hint":"Tilt amount to start tracking a potential decision", "min":0.05, "max":0.5, "step":0.05}
//@input float commitThreshold = 0.3 {"label":"Commit Threshold", "hint":"Tilt amount required to confirm a decision", "min":0.1, "max":0.6, "step":0.05}
//@input float neutralZone = 0.1 {"label":"Neutral Zone", "hint":"Dead zone around center to prevent drift", "min":0.0, "max":0.2, "step":0.02}

//@ui {"widget":"separator"}
//@ui {"widget":"label", "label":"Timing"}
//@input float holdDuration = 0.2 {"label":"Hold Duration (s)", "hint":"Time to hold tilt before confirming", "min":0.05, "max":1.0, "step":0.05}
//@input float cooldownDuration = 0.25 {"label":"Cooldown Duration (s)", "hint":"Time after decision before next can be made", "min":0.0, "max":1.0, "step":0.05}

//@ui {"widget":"separator"}
//@ui {"widget":"label", "label":"Responsiveness"}
//@input float smoothingFactor = 0.4 {"label":"Smoothing Factor", "hint":"Higher = more responsive, Lower = smoother (0.1-0.5)", "min":0.1, "max":0.5, "step":0.05}
//@input float velocityInfluence = 0.5 {"label":"Velocity Influence", "hint":"How much quick movements boost the signal", "min":0.0, "max":1.0, "step":0.1}
//@input float quickTiltMultiplier = 1.3 {"label":"Quick Tilt Multiplier", "hint":"Threshold multiplier for fast snappy tilts", "min":1.0, "max":2.0, "step":0.1}

//@ui {"widget":"separator"}
//@ui {"widget":"label", "label":"Callbacks"}
//@input bool enableCallbacks = false {"label":"Enable Callbacks", "hint":"Toggle callback system"}
//@ui {"widget":"group_start", "label":"Callback Settings", "showIf":"enableCallbacks"}
//@input int callbackType = 0 {"widget":"combobox", "values":[{"label":"Global Function", "value":0}, {"label":"Custom Script", "value":1}], "hint":"Global function or custom script reference"}
//@input string onTiltUpdateGlobalName {"label":"On Tilt Update", "showIf":"callbackType", "showIfValue":0, "hint":"Global function for tilt updates"}
//@input string onTiltDecisionGlobalName {"label":"On Tilt Decision", "showIf":"callbackType", "showIfValue":0, "hint":"Global function for tilt decisions"}
//@input Component.ScriptComponent customScript {"label":"Custom Script", "showIf":"callbackType", "showIfValue":1, "hint":"Script component containing callback functions"}
//@input string onTiltUpdateFunctionName {"label":"On Tilt Update", "showIf":"callbackType", "showIfValue":1, "hint":"Function name for tilt updates"}
//@input string onTiltDecisionFunctionName {"label":"On Tilt Decision", "showIf":"callbackType", "showIfValue":1, "hint":"Function name for tilt decisions"}
//@ui {"widget":"group_end"}

//@ui {"widget":"separator"}
//@input bool advancedOptions = false
//@ui {"widget":"group_start", "label":"Advanced Options", "showIf":"advancedOptions"}
//@input bool trackUpdates = true {"hint":"Enable onTiltUpdate events every frame"}
//@input bool enableLogging = false
//@ui {"widget":"group_end"}

// ===== Component Setup =====
var sceneObject = script.getSceneObject();
var headTransform = null;

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
var onTiltUpdateEvent = new EventDispatcher();
var onTiltDecisionEvent = new EventDispatcher();

// ===== Public API =====
script.onTiltUpdate = onTiltUpdateEvent;
script.onTiltDecision = onTiltDecisionEvent;

script.setEnabled = setEnabled;
script.isEnabled = isEnabled;
script.getSmoothedTilt = getSmoothedTilt;
script.getRawTilt = getRawTilt;
script.getPendingDirection = getPendingDirection;
script.getConfidence = getConfidence;
script.resetState = resetState;

// ===== Internal State =====
var state = {
    // Tilt values
    raw: 0,
    smoothed: 0,
    velocity: 0,
    lastRaw: 0,
    
    // Decision tracking
    currentDirection: 0,      // -1 = left, 0 = neutral, 1 = right
    holdTimer: 0,
    cooldownTimer: 0,
    
    // Pending decision
    isPending: false,
    pendingDirection: 0,
    confidence: 0
};

// ===== Initialization =====
function init() {
    if (!script.head) {
        debugLog("ERROR: Head component not assigned!", true);
        return;
    }
    
    headTransform = script.head.getSceneObject().getTransform();
    
    debugLog("Initialized");
}

// ===== Update Loop =====
function onUpdate(eventData) {
    if (!script.detectionEnabled || !headTransform) return;
    
    var deltaTime = eventData.getDeltaTime();
    
    // Prevent large delta spikes
    if (deltaTime > 0.1) deltaTime = 0.1;
    
    updateTilt(deltaTime);
}

function updateTilt(deltaTime) {
    // Get raw head rotation (negative = tilt left, positive = tilt right)
    var rawTilt = headTransform.up.x;
    
    // Calculate velocity
    state.velocity = (rawTilt - state.lastRaw) / Math.max(deltaTime, 0.001);
    state.lastRaw = rawTilt;
    state.raw = rawTilt;
    
    // Apply smoothing (exponential moving average)
    state.smoothed = lerp(state.smoothed, rawTilt, script.smoothingFactor);
    
    // Apply velocity boost for quick intentional movements
    var velocityBoost = Math.sign(state.velocity) * 
        Math.min(Math.abs(state.velocity) * script.velocityInfluence * 0.1, 0.15);
    var effectiveTilt = state.smoothed + velocityBoost;
    
    // Update cooldown
    if (state.cooldownTimer > 0) {
        state.cooldownTimer -= deltaTime;
        triggerUpdateEvent(effectiveTilt);
        return;
    }
    
    // Determine current direction
    var newDirection = 0;
    if (effectiveTilt < -script.activationThreshold) {
        newDirection = -1; // Left
    } else if (effectiveTilt > script.activationThreshold) {
        newDirection = 1;  // Right
    } else if (Math.abs(effectiveTilt) < script.neutralZone) {
        newDirection = 0;  // Neutral
    } else {
        // Between neutral and activation - maintain previous direction
        newDirection = state.currentDirection;
    }
    
    // Handle direction changes
    if (newDirection !== state.currentDirection) {
        state.currentDirection = newDirection;
        state.holdTimer = 0;
        state.isPending = false;
        state.confidence = 0;
    }
    
    // Process active tilt direction
    if (newDirection !== 0) {
        state.holdTimer += deltaTime;
        
        // Calculate confidence based on hold time and tilt strength
        var holdProgress = Math.min(state.holdTimer / script.holdDuration, 1);
        var tiltStrength = remap(
            Math.abs(effectiveTilt),
            script.activationThreshold,
            script.commitThreshold,
            0, 1, true
        );
        
        state.confidence = holdProgress * (0.5 + tiltStrength * 0.5);
        state.isPending = true;
        state.pendingDirection = newDirection;
        
        // Standard commit: held long enough AND tilted far enough
        var shouldCommit = (
            state.holdTimer >= script.holdDuration &&
            Math.abs(effectiveTilt) >= script.commitThreshold
        );
        
        // Quick commit: fast snappy tilt (reduced time, increased threshold)
        var quickCommit = (
            Math.abs(effectiveTilt) >= script.commitThreshold * script.quickTiltMultiplier &&
            state.holdTimer >= script.holdDuration * 0.4
        );
        
        if (shouldCommit || quickCommit) {
            commitDecision(newDirection);
        }
    } else {
        state.isPending = false;
        state.confidence = 0;
    }
    
    triggerUpdateEvent(effectiveTilt);
}

function triggerUpdateEvent(effectiveTilt) {
    if (!script.trackUpdates) return;
    
    // Normalize tilt so that commitThreshold = ±1
    var normalizedTilt = clamp(effectiveTilt / script.commitThreshold, -1, 1);
    
    var updateData = {
        raw: state.raw,
        smoothed: state.smoothed,
        normalized: normalizedTilt,
        velocity: state.velocity,
        pendingDirection: state.isPending ? state.pendingDirection : 0,
        confidence: state.confidence,
        isInCooldown: state.cooldownTimer > 0
    };
    
    // Trigger programmatic callbacks
    onTiltUpdateEvent.trigger(updateData);
    
    // Trigger configured callbacks
    triggerCallback("update", updateData);
}

function commitDecision(direction) {
    state.cooldownTimer = script.cooldownDuration;
    state.isPending = false;
    state.holdTimer = 0;
    
    var finalConfidence = state.confidence;
    state.confidence = 0;
    
    // direction: -1 = left, 1 = right
    var isRight = (direction === 1);
    
    debugLog("DECISION: " + (isRight ? "RIGHT" : "LEFT") + " (confidence: " + finalConfidence.toFixed(2) + ")");
    
    var decisionData = {
        isRight: isRight,
        direction: direction,
        confidence: finalConfidence
    };
    
    // Trigger programmatic callbacks
    onTiltDecisionEvent.trigger(decisionData);
    
    // Trigger configured callbacks
    triggerCallback("decision", decisionData);
}

// ===== Callback System =====
function triggerCallback(eventType, data) {
    if (!script.enableCallbacks) return;
    
    var globalName, customName;
    
    switch (eventType) {
        case "update":
            globalName = script.onTiltUpdateGlobalName;
            customName = script.onTiltUpdateFunctionName;
            break;
        case "decision":
            globalName = script.onTiltDecisionGlobalName;
            customName = script.onTiltDecisionFunctionName;
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
    if (!bool) {
        resetState();
    }
}

function isEnabled() {
    return script.detectionEnabled;
}

function getSmoothedTilt() {
    return state.smoothed;
}

function getRawTilt() {
    return state.raw;
}

function getPendingDirection() {
    return state.isPending ? state.pendingDirection : 0;
}

function getConfidence() {
    return state.confidence;
}

function resetState() {
    state.raw = 0;
    state.smoothed = 0;
    state.velocity = 0;
    state.lastRaw = 0;
    state.currentDirection = 0;
    state.holdTimer = 0;
    state.cooldownTimer = 0;
    state.isPending = false;
    state.pendingDirection = 0;
    state.confidence = 0;
    debugLog("State Reset");
}

// ===== Utility Functions =====
function lerp(a, b, t) {
    return a + (b - a) * t;
}

function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

function remap(val, inMin, inMax, outMin, outMax, shouldClamp) {
    var mapped = ((val - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
    if (shouldClamp) {
        mapped = clamp(mapped, Math.min(outMin, outMax), Math.max(outMin, outMax));
    }
    return mapped;
}

// ===== Debug =====
function debugLog(message, force) {
    if (!force && !script.enableLogging) return;
    var newLog = "[HeadTiltDetector] " + message;
    if (global.textLogger) global.logToScreen(newLog);
    print(newLog);
}

// ===== Events =====
script.createEvent("OnStartEvent").bind(init);
script.createEvent("UpdateEvent").bind(onUpdate);