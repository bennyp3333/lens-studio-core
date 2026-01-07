/*
LookAt.js
Version: 0.1.1
Description: Rotates this SceneObject to face a target using various modes.
             Supports Look At Point, Look At Direction, and Billboard modes
             with optional axis constraints, smoothing, and rotation offsets.
Author: Bennyp3333 [https://benjamin-p.dev]

 ==== USAGE ====
 1. Add this script to the SceneObject you want to rotate
 2. Assign a target (defaults to main camera if not set)
 3. Choose a mode: Look At Point, Look At Direction, or Billboard
 4. Configure up vector, smoothing, and other options as needed

 ==== API ====
 script.lookAt(instant?) - Manually trigger look at calculation
 script.start() - Enable continuous updates
 script.stop() - Disable continuous updates
 script.setTarget(SceneObject) - Change target at runtime
*/

//@input SceneObject target {"hint": "Target to look at (defaults to camera)"}
//@input string mode = "lookAt" {"widget": "combobox", "values": [{"label": "Look At Point", "value": "lookAt"}, {"label": "Look At Direction", "value": "lookAtDir"}, {"label": "Billboard", "value": "billboard"}]}

//@ui {"widget": "separator"}
//@ui {"widget": "label", "label": "Orientation"}
//@input string constrainAxis = "y" {"label": "Constrain Axis", "widget": "combobox", "values": [{"label": "X", "value": "x"}, {"label": "Y", "value": "y"}, {"label": "Z", "value": "z"}], "showIf": "mode", "showIfValue": "billboard"}
//@input string up = "y" {"label": "Up Vector", "widget": "combobox", "values": [{"label": "X", "value": "x"}, {"label": "Y", "value": "y"}, {"label": "Z", "value": "z"}]}
//@input string space = "world" {"label": "Space", "widget": "combobox", "values": [{"label": "World", "value": "world"}, {"label": "Local", "value": "local"}]}
//@input vec3 offsetRotation {"label": "Rotation Offset", "hint": "Offset in degrees"}
//@input bool flipFacingDir {"label": "Flip Direction"}

//@ui {"widget": "separator"}
//@ui {"widget": "label", "label": "Smoothing"}
//@input bool enableSmoothing {"label": "Enable Smoothing"}
//@input float smoothingSpeed = 5 {"label": "Smoothing Speed", "showIf": "enableSmoothing", "hint": "Higher = faster"}

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
    if (!script.target) {
        script.target = global.MainCamera ? global.MainCamera : findCamera();
    }
    
    if (!script.target) {
        debugLog("WARNING: No target found", true);
        return;
    }
    
    targetTransform = script.target.getTransform();
    updateEvent.enabled = script.runOnUpdate;
    
    debugLog("Initialized - Mode: " + script.mode + ", Target: " + script.target.name);
    
    if (script.runOnStart) {
        doLookAt(true);
    }
}

// ===== Core Functions =====

function doLookAt(instant) {
    if (!targetTransform || !transform) {
        debugLog("WARNING: Missing transforms", true);
        return;
    }

    var upVec = getUpVector(script.up);
    var isLocal = script.space === "local";
    var targetPos = targetTransform.getWorldPosition();
    var selfPos = transform.getWorldPosition();

    var lookQuat = null;

    if (script.mode === "lookAt") {
        var dir = script.flipFacingDir ? selfPos.sub(targetPos) : targetPos.sub(selfPos);
        if (dir.lengthSquared === 0) return;
        lookQuat = quat.lookAt(dir.normalize(), upVec);
        
    } else if (script.mode === "lookAtDir") {
        var forwardVec = script.flipFacingDir 
            ? targetTransform.forward.uniformScale(-1) 
            : targetTransform.forward;
        if (forwardVec.lengthSquared === 0) return;
        lookQuat = quat.lookAt(forwardVec.normalize(), upVec);
        
    } else if (script.mode === "billboard") {
        var lookDir = script.flipFacingDir ? selfPos.sub(targetPos) : targetPos.sub(selfPos);
        lookDir = constrainDirection(lookDir, script.constrainAxis);
        if (lookDir.lengthSquared === 0) return;
        lookQuat = quat.lookAt(lookDir.normalize(), upVec);
    }

    lookQuat = applyRotationOffset(lookQuat, script.offsetRotation);

    if (script.enableSmoothing && !instant) {
        var currentRotation = isLocal 
            ? transform.getLocalRotation() 
            : transform.getWorldRotation();
        lookQuat = quat.slerp(currentRotation, lookQuat, script.smoothingSpeed * getDeltaTime());
    }
    
    if (isLocal) {
        transform.setLocalRotation(lookQuat);
    } else {
        transform.setWorldRotation(lookQuat);
    }
}

// ===== Public API =====

script.lookAt = function(instant) {
    doLookAt(instant);
};

script.start = function() {
    updateEvent.enabled = true;
    debugLog("Started updates");
};

script.stop = function() {
    updateEvent.enabled = false;
    debugLog("Stopped updates");
};

script.setTarget = function(newTarget) {
    if (!newTarget) {
        debugLog("WARNING: setTarget called with null", true);
        return;
    }
    script.target = newTarget;
    targetTransform = newTarget.getTransform();
    debugLog("Target changed to: " + newTarget.name);
};

// ===== Helper Functions =====

function constrainDirection(dir, axis) {
    var constrained = new vec3(dir.x, dir.y, dir.z);
    if (axis === "x") constrained.x = 0;
    if (axis === "y") constrained.y = 0;
    if (axis === "z") constrained.z = 0;
    return constrained;
}

function getUpVector(axis) {
    if (axis === "x") return new vec3(1, 0, 0);
    if (axis === "y") return new vec3(0, 1, 0);
    if (axis === "z") return new vec3(0, 0, 1);
    return new vec3(0, 1, 0);
}

function applyRotationOffset(rotation, offsetDeg) {
    var offsetQuat = quat.fromEulerAngles(
        degToRad(offsetDeg.x), 
        degToRad(offsetDeg.y), 
        degToRad(offsetDeg.z)
    );
    return rotation.multiply(offsetQuat);
}

function degToRad(degrees) {
    return degrees * (Math.PI / 180);
}

function findCamera() {
    for (var i = 0; i < global.scene.getRootObjectsCount(); i++) {
        var rootObject = global.scene.getRootObject(i);
        var found = findCameraInHierarchy(rootObject);
        if (found) return found;
    }
    debugLog("WARNING: No camera found in scene", true);
    return null;
}

function findCameraInHierarchy(obj) {
    if (obj.getComponents("Component.Camera").length > 0) {
        debugLog("Found camera: " + obj.name);
        return obj;
    }
    
    for (var i = 0; i < obj.getChildrenCount(); i++) {
        var found = findCameraInHierarchy(obj.getChild(i));
        if (found) return found;
    }
    return null;
}

// ===== Debug =====

function debugLog(message, force) {
    if (!force && !script.enableLogging) return;
    var newLog = "[LookAt]-" + sceneObject.name + " " + message;
    if (global.textLogger) global.logToScreen(newLog);
    print(newLog);
}

// ===== Events =====

var updateEvent = script.createEvent("UpdateEvent");
updateEvent.enabled = false;
updateEvent.bind(function() {
    doLookAt(false);
});

script.createEvent("OnStartEvent").bind(init);