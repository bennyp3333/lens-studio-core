/*
SmoothFollow.js
Version: 0.1.1
Description: Makes this SceneObject smoothly follow another SceneObject's position and/or rotation.
             Supports independent smoothing controls for position and rotation.
Author: Bennyp3333 [https://benjamin-p.dev]

 ==== USAGE ====
 1. Add this script to the SceneObject you want to follow
 2. Assign the target SceneObject to "Attach To"
 3. Configure position and rotation smoothing as needed

 ==== API ====
 script.update(instant?) - Manually trigger follow update
 script.start(reset?) - Enable continuous updates, optionally reset to target
 script.stop() - Disable continuous updates
 script.reset() - Snap to target position and rotation
 script.setTarget(SceneObject) - Change target at runtime
*/

//@input SceneObject attachTo {"label": "Attach To", "hint": "Target to follow"}

//@ui {"widget": "separator"}
//@ui {"widget": "label", "label": "Position"}
//@input bool followPosition = true {"label": "Follow Position"}
//@input bool smoothPosition = true {"label": "Smooth Position", "showIf": "followPosition"}
//@input float positionSpeed = 5.0 {"label": "Position Speed", "showIf": "smoothPosition", "hint": "Higher = faster"}

//@ui {"widget": "separator"}
//@ui {"widget": "label", "label": "Rotation"}
//@input bool followRotation = false {"label": "Follow Rotation"}
//@input bool smoothRotation = true {"label": "Smooth Rotation", "showIf": "followRotation"}
//@input float rotationSpeed = 5.0 {"label": "Rotation Speed", "showIf": "smoothRotation", "hint": "Higher = faster"}

//@ui {"widget": "separator"}
//@ui {"widget": "label", "label": "Execution"}
//@input bool runOnStart = true {"label": "Run On Start"}
//@input bool runOnUpdate = true {"label": "Run On Update"}

//@ui {"widget": "separator"}
//@input bool enableLogging = false {"label": "Enable Logging"}

var sceneObject = script.getSceneObject();
var transform = sceneObject.getTransform();
var targetTransform = null;

// ===== Initialization =====

function init() {
    if (!script.attachTo) {
        debugLog("WARNING: No target assigned", true);
        return;
    }
    
    targetTransform = script.attachTo.getTransform();
    updateEvent.enabled = script.runOnUpdate;
    
    debugLog("Initialized - Target: " + script.attachTo.name);
    
    if (script.runOnStart) {
        doFollow(true);
    }
}

// ===== Core Functions =====

function doFollow(instant) {
    if (!targetTransform) {
        debugLog("WARNING: Missing target transform", true);
        return;
    }
    
    // Handle position
    if (script.followPosition) {
        var targetPos = targetTransform.getWorldPosition();
        
        if (script.smoothPosition && !instant) {
            var currentPos = transform.getWorldPosition();
            var smoothedPos = vec3.lerp(currentPos, targetPos, script.positionSpeed * getDeltaTime());
            transform.setWorldPosition(smoothedPos);
        } else {
            transform.setWorldPosition(targetPos);
        }
    }

    // Handle rotation
    if (script.followRotation) {
        var targetRot = targetTransform.getWorldRotation();
        
        if (script.smoothRotation && !instant) {
            var currentRot = transform.getWorldRotation();
            var smoothedRot = quat.slerp(currentRot, targetRot, script.rotationSpeed * getDeltaTime());
            transform.setWorldRotation(smoothedRot);
        } else {
            transform.setWorldRotation(targetRot);
        }
    }
}

// ===== Public API =====

script.update = function(instant) {
    doFollow(instant);
};

script.start = function(reset) {
    updateEvent.enabled = true;
    if (reset) script.reset();
    debugLog("Started updates");
};

script.stop = function() {
    updateEvent.enabled = false;
    debugLog("Stopped updates");
};

script.reset = function() {
    doFollow(true);
    debugLog("Reset to target");
};

script.setTarget = function(newTarget) {
    if (!newTarget) {
        debugLog("WARNING: setTarget called with null", true);
        return;
    }
    script.attachTo = newTarget;
    targetTransform = newTarget.getTransform();
    debugLog("Target changed to: " + newTarget.name);
};

// ===== Debug =====

function debugLog(message, force) {
    if (!force && !script.enableLogging) return;
    var newLog = "[SmoothFollow]-" + sceneObject.name + " " + message;
    if (global.textLogger) global.logToScreen(newLog);
    print(newLog);
}

// ===== Events =====

var updateEvent = script.createEvent("UpdateEvent");
updateEvent.enabled = false;
updateEvent.bind(function() {
    doFollow(false);
});

script.createEvent("OnStartEvent").bind(init);