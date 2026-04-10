/*
ScreenWiggle.js
Version: 0.2.0
Description: Applies a sinusoidal bobbing and rotation animation to one or more UI elements'
             ScreenTransforms. Supports independent horizontal/vertical bobbing with aspect-ratio
             correction so that equal bob amounts produce equal visual displacement regardless of
             screen orientation. Optional tilt rotation and per-instance randomization are also
             supported. When multiple targets are provided each one gets its own randomized
             parameters so they move independently.
Author: Bennyp3333 [https://benjamin-p.dev]

 ==== USAGE ====
 1. Add this script to any SceneObject (it does not need a ScreenTransform itself when targets
    are supplied via the Extra Targets list)
 2. Optionally add ScreenTransform components to the "Extra Targets" list. If the list is empty
    the script falls back to the ScreenTransform on its own SceneObject (original behaviour).
 3. Optionally assign a camera for automatic aspect-ratio correction (auto-discovered if not set)
 4. Configure bob speeds, amounts, and variation settings per axis
 5. Enable runOnStart to auto-play, or call script.start() manually from another script

 ==== API ====
 script.start()      - Begin wiggle animation
 script.stop()       - Pause wiggle animation (position is held at last frame)
 script.reset()      - Reset animation time and re-randomize parameters (if randomizeOnStart is true)
 script.randomize()  - Force re-randomize all targets regardless of the randomizeOnStart setting
*/

//@input Component.ScreenTransform[] screenTransforms {"label":"Extra Targets (Optional)", "hint":"If empty, wiggles the ScreenTransform on this SceneObject."}
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
var camera = script.camera;

var aspectRatio = 1.0;
var time = 0;

// Array of per-target state objects.
// Each entry: { screenTransform, initialCenter,
//               rSpeedY, rAmountY, rPhaseY,
//               rSpeedX, rAmountX, rPhaseX,
//               rRotSpeed, rRotAmount, rPhaseRot }
var targets = [];

// ===== Core Functions =====

function randomize(state, force) {
    if (force || script.randomizeOnStart) {
        state.rSpeedY  = script.bobSpeedY  * (1 + (Math.random() * 2 - 1) * script.speedVariationY);
        state.rAmountY = script.bobAmountY * (1 + (Math.random() * 2 - 1) * script.amountVariationY);
        state.rPhaseY  = Math.random() * Math.PI * 2;

        state.rSpeedX  = script.bobSpeedX  * (1 + (Math.random() * 2 - 1) * script.speedVariationX);
        state.rAmountX = script.bobAmountX * (1 + (Math.random() * 2 - 1) * script.amountVariationX);
        state.rPhaseX  = Math.random() * Math.PI * 2;

        state.rRotSpeed  = script.rotationSpeed  * (1 + (Math.random() * 2 - 1) * script.speedVariationRot);
        state.rRotAmount = script.rotationAmount * (1 + (Math.random() * 2 - 1) * script.amountVariationRot) * (Math.PI / 180);
        state.rPhaseRot  = Math.random() * Math.PI * 2;
    } else {
        state.rSpeedY  = script.bobSpeedY;
        state.rAmountY = script.bobAmountY;
        state.rPhaseY  = 0;

        state.rSpeedX  = script.bobSpeedX;
        state.rAmountX = script.bobAmountX;
        state.rPhaseX  = 0;

        state.rRotSpeed  = script.rotationSpeed;
        state.rRotAmount = script.rotationAmount * (Math.PI / 180);
        state.rPhaseRot  = 0;
    }

    debugLog(
        "Randomize [" + state.screenTransform.getSceneObject().name + "]" +
        " → X: speed=" + state.rSpeedX.toFixed(2) + " amt=" + state.rAmountX.toFixed(3) +
        " | Y: speed=" + state.rSpeedY.toFixed(2) + " amt=" + state.rAmountY.toFixed(3) +
        " | Rot: speed=" + state.rRotSpeed.toFixed(2) + " amt=" + (state.rRotAmount * (180 / Math.PI)).toFixed(2) + "deg"
    );
}

function init() {
    if (!camera) {
        camera = findCamera();
    }

    if (camera) {
        aspectRatio = camera.aspect;
        debugLog("Camera found. Aspect ratio: " + aspectRatio.toFixed(4));
    } else {
        debugLog("WARNING: No camera found — aspect ratio correction disabled (ratio = 1.0)", true);
    }

    // Determine which ScreenTransforms to drive.
    var sourceList;
    if (script.screenTransforms && script.screenTransforms.length > 0) {
        sourceList = script.screenTransforms;
    } else {
        var localST = sceneObject.getComponent("Component.ScreenTransform");
        if (!localST) {
            debugLog("WARNING: No Extra Targets set and no ScreenTransform on this SceneObject!", true);
            return false;
        }
        sourceList = [localST];
    }

    targets = [];
    for (var i = 0; i < sourceList.length; i++) {
        var st = sourceList[i];
        if (!st) continue;
        var state = {
            screenTransform: st,
            initialCenter: st.anchors.getCenter()
        };
        randomize(state);
        targets.push(state);
    }

    if (targets.length === 0) {
        debugLog("WARNING: No valid ScreenTransform targets found!", true);
        return false;
    }

    debugLog("Initialized — " + targets.length + " target(s), runOnStart: " + script.runOnStart);
    return true;
}

function onUpdate() {
    time += getDeltaTime();

    for (var i = 0; i < targets.length; i++) {
        var s = targets[i];

        var offsetY = 0;
        if (script.enableVertical) {
            // bobAmountY is in screen-width units (1.0 = full screen width).
            // Convert to anchor Y units: screen width = 2 * aspectRatio anchor Y units.
            offsetY = Math.sin(time * s.rSpeedY + s.rPhaseY) * s.rAmountY * 2 * aspectRatio;
        }

        var offsetX = 0;
        if (script.enableHorizontal) {
            // bobAmountX is in screen-width units (1.0 = full screen width).
            // Convert to anchor X units: screen width = 2 anchor X units.
            offsetX = Math.sin(time * s.rSpeedX + s.rPhaseX) * s.rAmountX * 2;
        }

        s.screenTransform.anchors.setCenter(new vec2(
            s.initialCenter.x + offsetX,
            s.initialCenter.y + offsetY
        ));

        if (script.enableRotation) {
            var rot = Math.sin(time * s.rRotSpeed + s.rPhaseRot) * s.rRotAmount;
            s.screenTransform.rotation = quat.angleAxis(rot, vec3.forward());
        }
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
    for (var i = 0; i < targets.length; i++) {
        randomize(targets[i]);
    }
    debugLog("Reset wiggle");
};

script.randomize = function() {
    for (var i = 0; i < targets.length; i++) {
        randomize(targets[i], true);
    }
    debugLog("Randomized wiggle");
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
