/*
ScreenWiggle.js
Version: 0.1.0
Description: Applies a sinusoidal bobbing and rotation animation to a UI element's ScreenTransform.
             Supports independent horizontal/vertical bobbing with aspect-ratio correction so that
             equal bob amounts produce equal visual displacement regardless of screen orientation.
             Optional tilt rotation and per-instance randomization are also supported.
Author: Bennyp3333 [https://benjamin-p.dev]

 ==== USAGE ====
 1. Add this script to a UI SceneObject that has a ScreenTransform component
 2. Optionally assign a camera for automatic aspect-ratio correction (auto-discovered if not set)
 3. Configure bob speeds, amounts, and variation settings per axis
 4. Enable runOnStart to auto-play, or call script.start() manually from another script

 ==== API ====
 script.start()  - Begin wiggle animation
 script.stop()   - Pause wiggle animation (position is held at last frame)
 script.reset()  - Reset animation time and re-randomize parameters (if randomizeOnStart is true)
*/

//@input Component.Camera camera {"label":"Camera (Optional)", "hint":"Used for aspect-ratio correction. Auto-discovered if not set."}

//@ui {"widget":"separator"}
//@ui {"widget":"group_start", "label":"Vertical Bobbing"}
//@input bool enableVertical = true {"label":"Enable Vertical"}
//@input float bobSpeedY = 1.0 {"label":"Bob Speed", "min":0.1, "max":5.0, "step":0.1, "showIf":"enableVertical"}
//@input float bobAmountY = 0.05 {"label":"Bob Amount", "min":0.001, "max":1.0, "step":0.001, "showIf":"enableVertical", "hint":"In screen-width units. 1.0 = full screen width."}
//@input float speedVariationY = 0.5 {"label":"Speed Variation", "min":0.0, "max":2.0, "step":0.1, "showIf":"enableVertical"}
//@input float amountVariationY = 0.3 {"label":"Amount Variation", "min":0.0, "max":1.0, "step":0.1, "showIf":"enableVertical"}
//@ui {"widget":"group_end"}

//@ui {"widget":"separator"}
//@ui {"widget":"group_start", "label":"Horizontal Bobbing"}
//@input bool enableHorizontal = true {"label":"Enable Horizontal"}
//@input float bobSpeedX = 0.8 {"label":"Bob Speed", "min":0.1, "max":5.0, "step":0.1, "showIf":"enableHorizontal"}
//@input float bobAmountX = 0.04 {"label":"Bob Amount", "min":0.001, "max":1.0, "step":0.001, "showIf":"enableHorizontal", "hint":"In screen-width units. 1.0 = full screen width."}
//@input float speedVariationX = 0.5 {"label":"Speed Variation", "min":0.0, "max":2.0, "step":0.1, "showIf":"enableHorizontal"}
//@input float amountVariationX = 0.3 {"label":"Amount Variation", "min":0.0, "max":1.0, "step":0.1, "showIf":"enableHorizontal"}
//@ui {"widget":"group_end"}

//@ui {"widget":"separator"}
//@ui {"widget":"group_start", "label":"Rotation"}
//@input bool enableRotation = true {"label":"Enable Rotation"}
//@input float rotationSpeed = 0.3 {"label":"Rotation Speed", "min":0.0, "max":2.0, "step":0.1, "showIf":"enableRotation"}
//@input float rotationAmount = 5.0 {"label":"Rotation Amount", "min":0.0, "max":45.0, "step":1.0, "showIf":"enableRotation"}
//@input float speedVariationRot = 0.5 {"label":"Speed Variation", "min":0.0, "max":2.0, "step":0.1, "showIf":"enableRotation"}
//@input float amountVariationRot = 0.3 {"label":"Amount Variation", "min":0.0, "max":1.0, "step":0.1, "showIf":"enableRotation"}
//@ui {"widget":"group_end"}

//@ui {"widget":"separator"}
//@input bool randomizeOnStart = true {"label":"Randomize On Start"}
//@input bool runOnStart = true {"label":"Run On Start"}

//@ui {"widget":"separator"}
//@input bool enableLogging = false {"label":"Enable Logging"}

// ===== Setup =====

var sceneObject = script.getSceneObject();
var screenTransform = sceneObject.getComponent("Component.ScreenTransform");
var camera = script.camera;

var initialCenter;
var aspectRatio = 1.0;
var time = 0;

// Randomized Y bob parameters
var rSpeedY, rAmountY, rPhaseY;
// Randomized X bob parameters
var rSpeedX, rAmountX, rPhaseX;
// Randomized rotation parameters
var rRotSpeed, rRotAmount, rPhaseRot;

// ===== Core Functions =====

function randomize() {
    if (script.randomizeOnStart) {
        rSpeedY  = script.bobSpeedY  * (1 + (Math.random() * 2 - 1) * script.speedVariationY);
        rAmountY = script.bobAmountY * (1 + (Math.random() * 2 - 1) * script.amountVariationY);
        rPhaseY  = Math.random() * Math.PI * 2;

        rSpeedX  = script.bobSpeedX  * (1 + (Math.random() * 2 - 1) * script.speedVariationX);
        rAmountX = script.bobAmountX * (1 + (Math.random() * 2 - 1) * script.amountVariationX);
        rPhaseX  = Math.random() * Math.PI * 2;

        rRotSpeed  = script.rotationSpeed  * (1 + (Math.random() * 2 - 1) * script.speedVariationRot);
        rRotAmount = script.rotationAmount * (1 + (Math.random() * 2 - 1) * script.amountVariationRot) * (Math.PI / 180);
        rPhaseRot  = Math.random() * Math.PI * 2;
    } else {
        rSpeedY  = script.bobSpeedY;
        rAmountY = script.bobAmountY;
        rPhaseY  = 0;

        rSpeedX  = script.bobSpeedX;
        rAmountX = script.bobAmountX;
        rPhaseX  = 0;

        rRotSpeed  = script.rotationSpeed;
        rRotAmount = script.rotationAmount * (Math.PI / 180);
        rPhaseRot  = 0;
    }

    debugLog(
        "Randomize → X: speed=" + rSpeedX.toFixed(2) + " amt=" + rAmountX.toFixed(3) +
        " | Y: speed=" + rSpeedY.toFixed(2) + " amt=" + rAmountY.toFixed(3) +
        " | Rot: speed=" + rRotSpeed.toFixed(2) + " amt=" + (rRotAmount * (180 / Math.PI)).toFixed(2) + "deg"
    );
}

function init() {
    if (!screenTransform) {
        debugLog("WARNING: Missing ScreenTransform component!");
        return false;
    }

    if (!camera) {
        camera = findCamera();
    }

    if (camera) {
        aspectRatio = camera.aspect;
        debugLog("Camera found. Aspect ratio: " + aspectRatio.toFixed(4));
    } else {
        debugLog("WARNING: No camera found — aspect ratio correction disabled (ratio = 1.0)", true);
    }

    initialCenter = screenTransform.anchors.getCenter();
    randomize();

    debugLog("Initialized — runOnStart: " + script.runOnStart);
    return true;
}

function onUpdate() {
    time += getDeltaTime();

    var offsetY = 0;
    if (script.enableVertical) {
        // bobAmountY is in screen-width units (1.0 = full screen width).
        // Convert to anchor Y units: screen width = 2 * aspectRatio anchor Y units.
        offsetY = Math.sin(time * rSpeedY + rPhaseY) * rAmountY * 2 * aspectRatio;
    }

    var offsetX = 0;
    if (script.enableHorizontal) {
        // bobAmountX is in screen-width units (1.0 = full screen width).
        // Convert to anchor X units: screen width = 2 anchor X units.
        offsetX = Math.sin(time * rSpeedX + rPhaseX) * rAmountX * 2;
    }

    screenTransform.anchors.setCenter(new vec2(
        initialCenter.x + offsetX,
        initialCenter.y + offsetY
    ));

    if (script.enableRotation) {
        var rot = Math.sin(time * rRotSpeed + rPhaseRot) * rRotAmount;
        screenTransform.rotation = quat.angleAxis(rot, vec3.forward());
    }
}

// ===== Public API =====

script.start = function() {
    updateEvent.enabled = true;
    debugLog("Started wiggle");
};

script.stop = function() {
    updateEvent.enabled = false;
    debugLog("Stopped wiggle");
};

script.reset = function() {
    time = 0;
    randomize();
    debugLog("Reset wiggle");
};

// ===== Camera Discovery =====

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
    var cameras = obj.getComponents("Component.Camera");
    if (cameras.length > 0) {
        debugLog("Found camera: " + obj.name);
        return cameras[0];
    }
    for (var i = 0; i < obj.getChildrenCount(); i++) {
        var found = findCameraInHierarchy(obj.getChild(i));
        if (found) return found;
    }
    return null;
}

// ===== Events =====

var updateEvent = script.createEvent("UpdateEvent");
updateEvent.enabled = false;
updateEvent.bind(onUpdate);

script.createEvent("OnStartEvent").bind(function() {
    if (init()) {
        updateEvent.enabled = script.runOnStart;
    }
});

// ===== Debug =====

function debugLog(message, force) {
    if (!force && !script.enableLogging) return;
    var newLog = "[ScreenWiggle]-" + sceneObject.name + ": " + message;
    if (global.textLogger) global.logToScreen(newLog);
    print(newLog);
}

