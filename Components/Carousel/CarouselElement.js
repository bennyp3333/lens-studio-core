/*
CarouselElement.js
Version: 0.1.0
Description: Individual element controller for LinearCarousel.
             Receives distance-from-center values and handles visual styling (scale, opacity, rotation).
Author: Bennyp3333 [https://benjamin-p.dev]

 ==== Usage ====
 1. Add this script to each carousel element (or its template if spawning)
 2. Configure visual behaviors via script inputs
 3. Optionally clone and edit this script to add custom visual behaviors
 4. The parent LinearCarousel will automatically call updateDistanceFromCenter()

 ==== Distance Values ====
 The parent carousel passes these values every frame:
   - normalizedDistance: 0 = centered, 1 = one spacing away, etc.
   - rawDistance: Actual screen-space distance from center
   - isCenter: Boolean, true if closest to center

 ==== API ====
 - updateDistanceFromCenter(normalized, raw, isCenter) - Called by parent carousel
 - setTexture(texture)          - Set the element's texture (for spawned carousels)
 - getNormalizedDistance()      - Get last normalized distance value
 - getRawDistance()             - Get last raw distance value
 - isCurrentlyCenter()          - Check if element is currently centered
 - setScale(factor)             - Manually set scale factor
 - setOpacity(alpha)            - Manually set opacity
 - getBaseScale()               - Get original scale vec2

 ==== Notes ====
 - Works with both spawned and pre-existing carousel elements
 - Auto-finds components on self or parent if not assigned
 - Custom visuals allow additional effects (particles, glow, etc.)
 - Uses global.easing if available for eased transitions

*/

//@input bool enableScaling = true {"label":"Enable Scale", "hint":"Scale elements based on distance from center"}
//@ui {"widget":"group_start", "label":"Scale Settings", "showIf":"enableScaling"}
//@input float centerScale = 1.0 {"widget":"slider", "min":0.5, "max":2.0, "step":0.05, "label":"Center Scale", "hint":"Scale when element is centered (1.0 = original size)"}
//@input float edgeScale = 0.7 {"widget":"slider", "min":0.0, "max":1.5, "step":0.05, "label":"Edge Scale", "hint":"Scale when element is at edge"}
//@input float scaleDistance = 2.0 {"widget":"slider", "min":1.0, "max":5.0, "step":0.5, "label":"Scale Falloff Distance", "hint":"Distance (in spacing units) to reach edge scale"}
//@input bool easeScale = true {"label":"Ease Scale", "hint":"Apply easing curve to scale transition"}
//@ui {"widget":"group_end"}

//@ui {"widget":"separator"}
//@input bool enableOpacity = true {"label":"Enable Opacity", "hint":"Fade elements based on distance from center"}
//@ui {"widget":"group_start", "label":"Opacity Settings", "showIf":"enableOpacity"}
//@input float centerOpacity = 1.0 {"widget":"slider", "min":0.0, "max":1.0, "step":0.05, "label":"Center Opacity", "hint":"Opacity when element is centered (0-1)"}
//@input float edgeOpacity = 0.5 {"widget":"slider", "min":0.0, "max":1.0, "step":0.05, "label":"Edge Opacity", "hint":"Opacity when element is at edge (0-1)"}
//@input float opacityDistance = 2.0 {"widget":"slider", "min":1.0, "max":5.0, "step":0.5, "label":"Opacity Falloff Distance", "hint":"Distance (in spacing units) to reach edge opacity"}
//@input bool easeOpacity = true {"label":"Ease Opacity", "hint":"Apply easing curve to opacity transition"}
//@ui {"widget":"group_end"}

//@ui {"widget":"separator"}
//@input bool enableRotation = false {"label":"Enable Rotation", "hint":"Rotate elements based on distance from center"}
//@ui {"widget":"group_start", "label":"Rotation Settings", "showIf":"enableRotation"}
//@input float maxRotation = 30.0 {"widget":"slider", "min":0.0, "max":90.0, "step":5.0, "label":"Max Rotation (degrees)", "hint":"Maximum rotation angle at edge"}
//@input float rotationDistance = 1.0 {"widget":"slider", "min":0.5, "max":3.0, "step":0.1, "label":"Full Rotation Distance", "hint":"Distance (in spacing units) to reach max rotation"}
//@ui {"widget":"group_end"}

//@ui {"widget":"separator"}
//@input bool enableRenderOrder = false {"label":"Enable Render Order", "hint":"Adjust render order so center elements appear on top"}
//@ui {"widget":"group_start", "label":"Render Order Settings", "showIf":"enableRenderOrder"}
//@input int baseRenderOrder = 0 {"label":"Base Render Order", "hint":"Minimum render order (floor for all elements)"}
//@input int renderOrderRange = 10 {"label":"Render Order Range", "hint":"How many layers above base for center element"}
//@ui {"widget":"group_end"}

//@ui {"widget":"separator"}
//@input bool enableCustomVisuals = false {"label":"Enable Custom Visuals", "hint":"Pass distance values to external script for additional effects"}
//@ui {"widget":"group_start", "label":"Custom Script", "showIf":"enableCustomVisuals"}
//@input Component.ScriptComponent customVisualScript {"label":"Custom Script", "hint":"Script component containing the custom function"}
//@input string customFunctionName = "onDistanceUpdate" {"label":"Function Name", "hint":"Function receives (normalized, raw, isCenter, sceneObject)"}
//@ui {"widget":"group_end"}

//@ui {"widget":"separator"}
//@input bool advanced
//@ui {"widget":"group_start", "label":"Advanced", "showIf":"advanced"}
//@input Component.ScreenTransform screenTransform {"label":"Screen Transform", "hint":"Leave empty to auto-find on self or parent"}
//@input Component.Image imageComponent {"label":"Image Component", "hint":"Leave empty to auto-find on self or parent"}
//@input bool makeMaterialUnique = true {"label":"Make Material Unique", "hint":"Clone material so spawned elements can have independent opacity"}
//@ui {"widget":"group_end"}

//@ui {"widget":"separator"}
//@input bool enableLogging = false {"label":"Enable Debug Logging"}

// Carousel Marker
script.isCarouselElement = true;

// Spawnable Marker
script.isSpawnable = true;
script.spawnId = null;
script.spawnGroup = null;
script.spawnManager = null;

// ============ STATE VARIABLES ============

var st = null;              // ScreenTransform
var img = null;             // Image component
var baseScale = null;       // Original scale to preserve proportions
var lastRawDistance = 0;
var lastNormalizedDistance = 0;
var lastIsCenter = false;

// ============ INITIALIZATION ============

function initialize() {
    // Get ScreenTransform
    if (script.screenTransform) {
        st = script.screenTransform;
    } else {
        st = script.getSceneObject().getComponent("Component.ScreenTransform");
        if (!st) {
            var parent = script.getSceneObject().getParent();
            if (parent) {
                st = parent.getComponent("Component.ScreenTransform");
            }
        }
    }
    
    if (!st) {
        debugLog("WARNING: No ScreenTransform found", true);
    } else {
        baseScale = st.anchors.getSize();
    }
    
    // Get Image component
    if (script.imageComponent) {
        img = script.imageComponent;
    } else {
        img = script.getSceneObject().getComponent("Component.Image");
        if (!img) {
            var parent = script.getSceneObject().getParent();
            if (parent) {
                img = parent.getComponent("Component.Image");
            }
        }
    }
    
    // Make material unique for spawned elements
    if (img && script.makeMaterialUnique) {
        makeMatUnique(img);
    }
    
    debugLog("Initialized" + (st ? " with ScreenTransform" : "") + (img ? " with Image" : ""));
}

// ============ MAIN UPDATE FROM CAROUSEL ============

/**
 * Called by LinearCarousel to update this element's visuals
 * @param {number} normalizedDistance - 0 = center, 1 = one spacing away, etc
 * @param {number} rawDistance - Actual distance from center in screen units
 * @param {boolean} isCenter - True if this element is closest to center
 */
script.updateDistanceFromCenter = function(normalizedDistance, rawDistance, isCenter) {
    lastNormalizedDistance = normalizedDistance;
    lastRawDistance = rawDistance;
    lastIsCenter = isCenter;
    
    if (script.enableScaling && st && baseScale) {
        applyScale(normalizedDistance);
    }
    
    if (script.enableOpacity && img) {
        applyOpacity(normalizedDistance);
    }

    if (script.enableRotation && st) {
        applyRotation(normalizedDistance);
    }

    if (script.enableRenderOrder && img) {
        applyRenderOrder(normalizedDistance);
    }

    if (script.enableCustomVisuals && script.customVisualScript) {
        callCustomVisuals(normalizedDistance, rawDistance, isCenter);
    }
};

// ============ VISUAL EFFECTS ============

function applyScale(distance) {
    var t = Math.min(distance / script.scaleDistance, 1.0);
    if (script.easeScale && global.easing) {
        t = global.easing.easeOutCubic(t);
    }
    var scaleFactor = lerp(script.centerScale, script.edgeScale, t);
    
    var newSize = new vec2(baseScale.x * scaleFactor, baseScale.y * scaleFactor);
    st.anchors.setSize(newSize);
}

function applyOpacity(distance) {
    var t = Math.min(distance / script.opacityDistance, 1.0);
    if (script.easeOpacity && global.easing) {
        t = global.easing.easeOutCubic(t);
    }
    var opacity = lerp(script.centerOpacity, script.edgeOpacity, t);
    
    setAlpha(opacity);
}

function applyRotation(distance) {
    var xPos = st.anchors.getCenter().x;
    var direction = xPos >= 0 ? 1 : -1;
    
    var t = Math.min(distance / script.rotationDistance, 1.0);
    var rotationDegrees = lerp(0, script.maxRotation * direction, t);
    var rotationRadians = rotationDegrees * (Math.PI / 180);
    
    st.rotation = quat.angleAxis(rotationRadians, vec3.forward());
}

function applyRenderOrder(distance) {
    var order = script.baseRenderOrder + Math.max(0, script.renderOrderRange - Math.round(distance));
    img.setRenderOrder(order);
}

function setAlpha(alpha) {
    if (!img) return;
    var currentColor = img.mainPass.baseColor;
    img.mainPass.baseColor = new vec4(currentColor.r, currentColor.g, currentColor.b, alpha);
}

function callCustomVisuals(normalizedDistance, rawDistance, isCenter) {
    if (!script.customVisualScript || !script.customFunctionName) return;
    
    var func = script.customVisualScript[script.customFunctionName];
    if (func) {
        try {
            func(normalizedDistance, rawDistance, isCenter, script.getSceneObject());
        } catch (e) {
            debugLog("ERROR: Custom function failed - " + e, true);
        }
    }
}

// ============ TEXTURE HANDLING ============

/**
 * Set texture on this element (called by parent for spawned carousels)
 * @param {Asset.Texture} texture 
 */
script.setTexture = function(texture) {
    if (!texture) return;
    
    if (img) {
        img.mainPass.baseTex = texture;
    } else {
        var foundImg = script.getSceneObject().getComponent("Component.Image");
        if (foundImg) {
            foundImg.mainPass.baseTex = texture;
        }
    }
    
    debugLog("Texture set: " + (texture.name || "unnamed"));
};

// ============ PUBLIC API ============

/**
 * Get current normalized distance (0 = center, 1+ = away from center)
 * @returns {number}
 */
script.getNormalizedDistance = function() {
    return lastNormalizedDistance;
};

/**
 * Get current raw distance in screen units
 * @returns {number}
 */
script.getRawDistance = function() {
    return lastRawDistance;
};

/**
 * Check if this element is currently centered
 * @returns {boolean}
 */
script.isCurrentlyCenter = function() {
    return lastIsCenter;
};

/**
 * Manually set scale factor (overrides automatic scaling for this frame)
 * @param {number} scaleFactor - Scale multiplier applied to base scale
 */
script.setScale = function(scaleFactor) {
    if (!st || !baseScale) return;
    st.anchors.setSize(new vec2(baseScale.x * scaleFactor, baseScale.y * scaleFactor));
};

/**
 * Manually set opacity (overrides automatic opacity for this frame)
 * @param {number} alpha - Opacity value 0-1
 */
script.setOpacity = function(alpha) {
    setAlpha(alpha);
};

/**
 * Get the base (original) scale of this element
 * @returns {vec2|null}
 */
script.getBaseScale = function() {
    return baseScale;
};

// ============ HELPER FUNCTIONS ============

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

function lerp(a, b, t) {
    return a + (b - a) * t;
}

// ============ DEBUG ============

function debugLog(message, force) {
    if (!force && !script.enableLogging) return;
    var newLog = "[CarouselElement] " + message;
    if (global.textLogger) global.logToScreen(newLog);
    print(newLog);
}

initialize();