/*
Popup.js
Version: 0.1.0
Description: Animated popup that fades in, slides in a random direction, fades out, and self-destructs.
    Use with SpawnManager to spawn popups at screen positions.
Author: Bennyp3333 [https://benjamin-p.dev]

 ==== SETUP ====
1. Create an Orthographic Camera in your scene (if you don't have one)
2. Under the Ortho Camera, create a Screen Image:
    - Click Ortho Camera > Add New Object (+) > "Screen Image"
    - This creates a SceneObject with a ScreenTransform and Image component
3. Configure the Screen Image:
    - Set the Image texture to your popup sprite (or leave empty to use script textures)
    - Adjust size via ScreenTransform as needed
4. Add this script (Popup.js) to the Screen Image SceneObject
    - Assign textures array if you want random texture selection
    - Adjust animation timing parameters as desired
5. DISABLE the SceneObject in the hierarchy
    - This is your "template" that gets copied when spawning
    - The SceneObject should be disabled, SpawnManager enables copies
6. Make sure SpawnManager.js is in your scene (already included in the core prefab)

 ==== USAGE ====
//@ input SceneObject popupRef {"hint":"Disabled popup template"}
//@ input SceneObject popupParent {"hint":"Parent for spawned popups"}

// Basic spawn at screen center:
var popup = global.spawn.create(script.popupRef, script.popupParent, "popups");
popup.script.animate(new vec2(0, 0));

// Spawn at touch position:
var touchEvent = script.createEvent("TouchStartEvent");
touchEvent.bind(function(eventData) {
    var touchPos = eventData.getTouchPosition();
    // Convert 0-1 touch coords to -1 to 1 screen space
    var screenPos = new vec2(
        touchPos.x * 2 - 1,
        touchPos.y * 2 - 1
    );
    var popup = global.spawn.create(script.popupRef, script.popupParent, "popups");
    popup.script.animate(screenPos);
});

// Clear all popups:
global.spawn.destroyGroup("popups");

// Dedicated function to spawn popups:
function spawnPopup(screenPos) {
    var popup = global.spawn.create(script.popupRef, script.popupParent, "popups");
    if (popup && popup.script) {
        popup.script.animate(screenPos);
    }
    return popup;
};
spawnPopup(new vec2(0, 0));
*/

//@input Asset.Texture[] textures {"hint":"Random texture selection on spawn"}
//@ui {"widget":"separator"}
//@ui {"widget":"label", "label":"Animation"}
//@input float fadeInTime = 0.1 {"hint":"Fade in duration (seconds)"}
//@input float fadeOutTime = 0.1 {"hint":"Fade out duration (seconds)"}
//@input float slideTime = 0.5 {"hint":"Slide duration (seconds)"}
//@input float slideDistance = 0.25 {"hint":"Slide distance (screen units)"}
//@ui {"widget":"separator"}
//@ui {"widget":"label", "label":"Trajectory"}
//@input vec2 trajectoryX = {-1, 1} {"hint":"Horizontal direction range [min, max]"}
//@input vec2 trajectoryY = {0, 1} {"hint":"Vertical direction range [min, max]"}
//@ui {"widget":"separator"}
//@input bool debug
//@input string debugName = "Popup" {"showIf":"debug"}
//@input Component.Text debugText {"showIf":"debug"}

// SPAWNABLE IDENTITY

// Mark this script as a spawnable (used by SpawnManager to find it)
script.isSpawnable = true;

// These are set by SpawnManager when spawned
script.spawnId = null;
script.spawnGroup = null;
script.spawnManager = null;

var self = script.getSceneObject();
var selfTransform = self.getTransform();
var selfScreenTransform = self.getComponent("Component.ScreenTransform");
var selfImage = self.getComponent("Component.Image");
var selfMaterial = null;

// LIFECYCLE CALLBACKS 

script.onSpawned = function() {
    initPopup();
    debugPrint("Spawned!");
};

script.onDespawn = function() {
    debugPrint("Despawning!");
};

// POPUP FUNCTIONS

function initPopup() {    
    // Make material unique so each popup can have different alpha/texture
    selfMaterial = makeMatUnique(selfImage)[0];
    
    // Set random texture from array
    if (script.textures && script.textures.length > 0) {
        selfMaterial.mainPass.baseTex = script.textures[Math.floor(Math.random() * script.textures.length)];
    }
    
    debugPrint("Initialized!");
}

/**
 * Animate the popup from a screen position
 * @param {vec2} startPos - Starting screen position (-1 to 1 range)
 */
script.animate = function(startPos) {
    debugPrint("Animating from: " + startPos);
    
    // Set initial position
    selfScreenTransform.anchors.setCenter(startPos);

    // Set inital alpha
    setAlpha(selfImage, 0);
    
    // Fade in
    global.simpleTween(0, 1, script.fadeInTime, 0, function(val) {
        var easedVal = global.easing.easeOutQuad(val);
        setAlpha(selfImage, easedVal);
    }, null);
    
    // Calculate random trajectory direction
    var randomDir = new vec2(
        randomRange(script.trajectoryX.x, script.trajectoryX.y), 
        randomRange(script.trajectoryY.x, script.trajectoryY.y)
    ).normalize();
    
    var endPos = startPos.add(randomDir.uniformScale(script.slideDistance));
    
    // Slide animation
    global.simpleTween(0, 1, script.slideTime, 0, function(val) {
        var easedVal = global.easing.easeOutCubic(val);
        var lerpedPos = vec2.lerp(startPos, endPos, easedVal);
        selfScreenTransform.anchors.setCenter(lerpedPos);
    }, null);
    
    // Fade out and despawn
    global.simpleTween(1, 0, script.fadeOutTime, script.slideTime - script.fadeOutTime, function(val) {
        var easedVal = global.easing.easeOutQuad(val);
        setAlpha(selfImage, easedVal);
    }, function() {
        script.despawn();
    });
};

// UTILITY FUNCTIONS

function makeMatUnique(meshVis) {
    var clonedMaterials = Array(meshVis.getMaterialsCount());
    for (var i = 0; i < clonedMaterials.length; i++) {
        clonedMaterials[i] = meshVis.getMaterial(i).clone();
    }
    meshVis.clearMaterials();
    for (var i = 0; i < clonedMaterials.length; i++) {
        meshVis.addMaterial(clonedMaterials[i]);
    }
    return clonedMaterials;
}

function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

function setAlpha(imageComp, alpha) {
    var matCount = imageComp.getMaterialsCount();
    for (var i = 0; i < matCount; i++) {
        var material = imageComp.getMaterial(i);
        var color = material.mainPass.baseColor;
        color.a = alpha;
        material.mainPass.baseColor = color;
    }
}

// SPAWNABLE METHODS

/**
 * Destroy this spawned object (removes from SpawnManager registry)
 */
script.despawn = function() {
    if (script.spawnManager && script.spawnId) {
        script.spawnManager.destroy(script.spawnId);
    } else {
        debugPrint("Warning: despawn called but not registered with SpawnManager");
        self.destroy();
    }
};

/**
 * Get this object's spawn ID
 * @returns {string|null}
 */
script.getId = function() {
    return script.spawnId;
};

/**
 * Get this object's spawn group
 * @returns {string|null}
 */
script.getGroup = function() {
    return script.spawnGroup;
};

/**
 * Get the SceneObject this script is attached to
 * @returns {SceneObject}
 */
script.getObject = function() {
    return self;
};

// DEBUG

function debugPrint(text) {
    if (!script.debug) return;
    var idStr = script.spawnId ? " [" + script.spawnId + "]" : "";
    var newLog = script.debugName + idStr + ": " + text;
    if (global.textLogger) global.logToScreen(newLog);
    if (script.debugText) script.debugText.text = newLog;
    print(newLog);
}

function errorPrint(text) {
    var idStr = script.spawnId ? " [" + script.spawnId + "]" : "";
    var errorLog = "!!ERROR!! " + script.debugName + idStr + ": " + text;
    if (global.textLogger) global.logError(errorLog);
    if (script.debugText) script.debugText.text = errorLog;
    print(errorLog);
}