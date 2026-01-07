/*
ScreenToWorld.js
Version: 0.1.0
Description: Places this SceneObject at a screen position converted to world space.
             Takes normalized screen coordinates (0-1) and a world depth value.
Author: Bennyp3333 [https://benjamin-p.dev]

 ==== USAGE ====
 1. Add this script to the SceneObject you want to position
 2. Set "Screen Position" as normalized coordinates (0,0 = top-left, 1,1 = bottom-right)
 3. Set "World Depth" as distance from camera's near plane
 4. Optional: Assign a specific camera, otherwise the script will auto-find a perspective camera

 ==== API ====
 script.setScreenPosition(vec2, instant?) - Update screen position
 script.setWorldDepth(number, instant?) - Update world depth
 script.setPosition(vec2, number, instant?) - Update both screen position and depth
 script.update(instant?) - Manually trigger position update
 script.start() - Enable continuous updates
 script.stop() - Disable continuous updates
*/

//@input vec2 screenPosition = {0.5, 0.5} {"label": "Screen Position", "hint": "Normalized screen coords (0-1), (0,0) = top-left"}
//@input float worldDepth = 100 {"label": "World Depth", "hint": "Distance from camera near plane"}
//@input Component.Camera camera {"label": "Camera (Optional)"}

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
var camera = script.camera;

// ===== Camera Discovery =====

function findCamera() {
    for (var i = 0; i < global.scene.getRootObjectsCount(); i++) {
        var rootObject = global.scene.getRootObject(i);
        var found = findCameraInHierarchy(rootObject);
        if (found) return found;
    }
    debugLog("WARNING: No perspective camera found in scene", true);
    return null;
}

function findCameraInHierarchy(obj) {
    var cameras = obj.getComponents("Component.Camera");
    for (var i = 0; i < cameras.length; i++) {
        if (cameras[i].type == Camera.Type.Perspective) {
            debugLog("Found perspective camera: " + obj.name);
            return cameras[i];
        }
    }
    
    for (var i = 0; i < obj.getChildrenCount(); i++) {
        var found = findCameraInHierarchy(obj.getChild(i));
        if (found) return found;
    }
    return null;
}

// ===== Core Functions =====

function init() {
    if (!camera) {
        camera = findCamera();
    }
    
    if (!camera) {
        debugLog("WARNING: No camera available - cannot position object", true);
        return false;
    }
    
    debugLog("Initialized with camera, FOV: " + camera.fov + ", Aspect: " + camera.aspect);
    return true;
}

function updatePosition(instant) {
    if (!camera) return;
    
    var targetPos = camera.screenSpaceToWorldSpace(script.screenPosition, script.worldDepth);
    
    if (script.enableSmoothing && !instant) {
        var currentPos = transform.getWorldPosition();
        var smoothedPos = vec3.lerp(currentPos, targetPos, script.smoothingSpeed * getDeltaTime());
        transform.setWorldPosition(smoothedPos);
    } else {
        transform.setWorldPosition(targetPos);
    }
    
    debugLog("Position: " + transform.getWorldPosition().toString());
}

// ===== Public API =====

script.setScreenPosition = function(pos, instant) {
    script.screenPosition = pos;
    updatePosition(instant);
};

script.setWorldDepth = function(depth, instant) {
    script.worldDepth = depth;
    updatePosition(instant);
};

script.setPosition = function(pos, depth, instant) {
    script.screenPosition = pos;
    script.worldDepth = depth;
    updatePosition(instant);
};

script.update = function(instant) {
    updatePosition(instant);
};

script.start = function() {
    updateEvent.enabled = true;
    debugLog("Started updates");
};

script.stop = function() {
    updateEvent.enabled = false;
    debugLog("Stopped updates");
};

// ===== Debug =====

function debugLog(message, force) {
    if (!force && !script.enableLogging) return;
    var newLog = "[ScreenToWorld]-" + sceneObject.name + " " + message;
    if (global.textLogger) global.logToScreen(newLog);
    print(newLog);
}

// ===== Events =====

var updateEvent = script.createEvent("UpdateEvent");
updateEvent.enabled = false;
updateEvent.bind(function() {
    updatePosition(false);
});

script.createEvent("OnStartEvent").bind(function() {
    if (init()) {
        updateEvent.enabled = script.runOnUpdate;
        if (script.runOnStart) {
            updatePosition(true);
        }
    }
});