/*
Fader.js
Version: 0.1.0
Description: Flexible fading system with support for fade, scale, and slide animations
Author: Bennyp3333 [https://benjamin-p.dev]

 ==== Usage ====
 Add this script to any SceneObject you want to fade.
 Access via: global.faderManager.show("objectName")

 Identifiers can be:
 - String (name or tag): "myObject" or "uiElements"
 - SceneObject reference: mySceneObject
 - Array of any combination: ["obj1", mySceneObj, "tag1", "obj2"]
 
 ==== Examples ====
 // Basic usage
 global.faderManager.show("myObjectName");
 global.faderManager.hide(myObject, {time: 0.5, delay: 0.2});

 // Cancel existing animations
 global.faderManager.show("myObject", {cancel: "all"}); // Default - Cancels everything
 global.faderManager.show("myObject", {cancel: "active"}); // Only cancels started animations
 global.faderManager.show("myObject", {cancel: "none"}); // Allows queuing

 // Queuing fades - fade in immediately, then fade out after 3 seconds
 global.faderManager.show("myObject", {delay: 0});
 global.faderManager.hide("myObject", {delay: 3, cancel: "none"});
 
 // With callbacks
 global.faderManager.show("myButton", {time: 0.5}, function() {
     print("Faded in!");
 });
 
 // With onStart callback
 global.faderManager.show("myButton", {
     delay: 1,
     onStart: function() { print("Animation started!"); },
     onComplete: function() { print("Animation complete!"); }
 });
 
 // Shorthand callback
 global.faderManager.hide("myButton", function() {
     print("Faded out!");
 });
 
 // Batch operations
 global.faderManager.show(["faderName", "tag"]);
 global.faderManager.hide([sceneObject, "sceneObjectName"]);

 ==== API ====
 Fader Methods:
 - show(animOptions, onComplete) - Shows the object
 - hide(animOptions, onComplete) - Hides the object  
 - toggle(animOptions, onComplete) - Toggles visibility
 - setAlpha(alpha) - Sets alpha instantly
 - setScale(scale, local) - Sets scale instantly
 - setRect(rect) - Sets screenTransform anchors instantly
 - refreshCache() - Refreshes component cache (call if components added/removed at runtime)
 
 FaderManager Methods:
 - show(identifier, animOptions, onComplete) - Shows fader(s)
 - hide(identifier, animOptions, onComplete) - Hides fader(s)  
 - toggle(identifier, animOptions, onComplete) - Toggles fader(s)
 - setAlpha(identifier, alpha) - Sets alpha instantly

  Where identifier can be:
   - String: fader name or tag
     (Fader name defualts to the name of the sceneObject if not manually set)
   - SceneObject: direct object reference  
   - Array: mix of strings/SceneObjects/tags
   Note: When multiple faders match, onComplete only executes once (from first fader)
 
 Anim Options (for show/hide/toggle):
 - time: Animation duration in seconds (default: fadeTime input, 0 = instant)
 - delay: Delay before animation starts in seconds (default: 0)
 - mode: Animation mode - "fade", "scale", or "slide" (default: inMode/outMode input)
 - cancel: How to handle existing animations - "none", "active", or "all" (default: "none")
   * "none" - Don't cancel any animations (allows queuing multiple animations)
   * "active" - Only cancel animations that have started (respects delays)
   * "all" - Cancel all animations including those in delay phase
 - onStart: Callback function called when animation begins (after delay)
 - onComplete: Callback function called when animation completes

 ==== Notes ====
 - Supports fade, scale, and slide modes
 - Different in/out animations per fader
 - Recursive alpha for children
 - Tag-based batch operations
*/

//@input string initialState = "visible" {"widget":"combobox", "values":[{"label":"Visible", "value":"visible"}, {"label":"Hidden", "value":"hidden"}]}
//@input bool autoShow = false
//@input float autoShowDelay = 0.0 {"showIf":"autoShow"}
//@input bool autoHide = false
//@input float autoHideDelay = 2.0 {"showIf":"autoHide"}
//@ui {"widget":"separator"}

//@ui {"widget":"group_start", "label":"In"}
//@input string inMode = "fade" {"label":"Mode", "widget":"combobox", "values":[{"label":"Fade", "value":"fade"}, {"label":"Scale", "value":"scale"}, {"label":"Slide", "value":"slide"}]}
//@input float inTime = 0.75 {"label":"Time"}
//@input bool inAdvanced = false {"label":"Advanced"}
//@ui {"widget":"group_start", "label":"Advanced", "showIf":"inAdvanced"}
//@input float inAlpha = 1.0 {"label":"Value", "showIf":"inMode", "showIfValue":"fade"}
//@input vec3 inScale = {1, 1, 1} {"label":"Scale", "showIf":"inMode", "showIfValue":"scale"}
//@input vec4 inRect = {-1, 1, -1, 1} {"label":"Rect", "showIf":"inMode", "showIfValue":"slide"}
//@input string inEasing = "Quadratic" {"label":"Easing Func", "widget":"combobox", "values":[{"label":"Linear", "value":"Linear"}, {"label":"Quadratic", "value":"Quadratic"}, {"label":"Cubic", "value":"Cubic"}, {"label":"Quartic", "value":"Quartic"}, {"label":"Quintic", "value":"Quintic"}, {"label":"Sinusoidal", "value":"Sinusoidal"}, {"label":"Exponential", "value":"Exponential"}, {"label":"Circular", "value":"Circular"}, {"label":"Elastic", "value":"Elastic"}, {"label":"Back", "value":"Back"}, {"label":"Bounce", "value":"Bounce"}]}
//@input string inEasingType = "Out" {"label":"Easing Type", "widget":"combobox", "values":[{"label":"In", "value":"In"}, {"label":"Out", "value":"Out"}, {"label":"In / Out", "value":"InOut"}]}
//@input bool inRecursiveFade = false {"label":"Recursive", "showIf":"inMode", "showIfValue":"fade"}
//@input string inFadeMaterialParameter = "baseColor" {"label":"Parameter", "showIf":"inMode", "showIfValue":"fade"}
//@input string inScaleLocal = "Local" {"label":"Local", "widget":"combobox", "showIf":"inMode", "showIfValue":"scale", "values":[{"label":"World", "value":"World"}, {"label":"Local", "value":"Local"}]}
//@ui {"widget":"group_end"}
//@ui {"widget":"group_end"}

//@ui {"widget":"group_start", "label":"Out"}
//@input string outMode = "fade" {"label":"Mode", "widget":"combobox", "values":[{"label":"Fade", "value":"fade"}, {"label":"Scale", "value":"scale"}, {"label":"Slide", "value":"slide"}]}
//@input float outTime = 0.75 {"label":"Time"}
//@input bool outAdvanced = false {"label":"Advanced"}
//@ui {"widget":"group_start", "label":"Advanced", "showIf":"outAdvanced"}
//@input float outAlpha = 0.0 {"label":"Value", "showIf":"outMode", "showIfValue":"fade"}
//@input vec3 outScale = {0, 0, 0} {"label":"Scale", "showIf":"outMode", "showIfValue":"scale"}
//@input vec4 outRect = {-1, 1, -1, 1} {"label":"Rect", "showIf":"outMode", "showIfValue":"slide"}
//@input string outEasing = "Quadratic" {"label":"Easing Func", "widget":"combobox", "values":[{"label":"Linear", "value":"Linear"}, {"label":"Quadratic", "value":"Quadratic"}, {"label":"Cubic", "value":"Cubic"}, {"label":"Quartic", "value":"Quartic"}, {"label":"Quintic", "value":"Quintic"}, {"label":"Sinusoidal", "value":"Sinusoidal"}, {"label":"Exponential", "value":"Exponential"}, {"label":"Circular", "value":"Circular"}, {"label":"Elastic", "value":"Elastic"}, {"label":"Back", "value":"Back"}, {"label":"Bounce", "value":"Bounce"}]}
//@input string outEasingType = "Out" {"label":"Easing Type", "widget":"combobox", "values":[{"label":"In", "value":"In"}, {"label":"Out", "value":"Out"}, {"label":"In / Out", "value":"InOut"}]}
//@input bool outRecursiveFade = false {"label":"Recursive", "showIf":"outMode", "showIfValue":"fade"}
//@input string outFadeMaterialParameter = "baseColor" {"label":"Parameter", "showIf":"outMode", "showIfValue":"fade"}
//@input string outScaleLocal = "Local" {"label":"Local", "widget":"combobox", "showIf":"outMode", "showIfValue":"scale", "values":[{"label":"World", "value":"World"}, {"label":"Local", "value":"Local"}]}
//@ui {"widget":"group_end"}
//@ui {"widget":"group_end"}

//@ui {"widget":"separator"}
//@input bool optional = false
//@input SceneObject sceneObject {"showIf":"optional"}
//@input string faderName {"showIf":"optional"}
//@input string[] faderTags {"showIf":"optional"}
//@input bool disableWhenHidden = false {"showIf":"optional"}
//@input bool makeMaterialsUnique = true {"showIf":"optional"}

//@ui {"widget":"separator"}
//@input bool debug
//@ui {"widget":"group_start", "label":"Debug", "showIf":"debug"}
//@input bool printDebugStatements = false
//@input bool printWarningStatements = true
//@ui {"widget":"group_end"}

const MODE_KEYS = {
    "fade": "Alpha",
    "scale": "Scale", 
    "slide": "Rect"
};

// ============ FADER CLASS ============

/**
 * Fader class controls visibility animations on a SceneObject
 * @param {SceneObject} sceneObj - The SceneObject to control
 * @param {Object} options - Fader configuration
 * @param {Object} scriptSettings - Settings from script inputs
 */
var Fader = function(sceneObj, options, scriptSettings) {
    this.sceneObj = sceneObj;
    this.options = options || {};
    this.scriptSettings = scriptSettings || {};
    
    this.name = this.options.name || sceneObj.name;
    this.tags = this.options.tags || [];
    this.disableWhenHidden = this.options.disableWhenHidden || false;
    this.makeMaterialsUnique = this.options.makeMaterialsUnique !== undefined ? this.options.makeMaterialsUnique : true;
        
    this._printDebug("Fader created - name: " + this.name + ", tags: [" + this.tags + "], disableWhenHidden: " + this.disableWhenHidden);
    
    this.animations = []; // Array to track all animations (active and delayed)
    this.isCurrentlyVisible = true;
    
    // Component cache
    this.refreshCache();
};

/**
 * Shows the object with animation
 * @param {Object} animOptions - Animation options (time, delay, mode, cancel, onStart, onComplete)
 * @param {function} onComplete - Completion callback
 */
Fader.prototype.show = function(animOptions, onComplete) {
    this._printDebug("Showing with options: " + JSON.stringify(animOptions || {}));
    this._animate("in", animOptions, onComplete);
};

/**
 * Hides the object with animation
 * @param {Object} animOptions - Animation options (time, delay, mode, cancel, onStart, onComplete)
 * @param {function} onComplete - Completion callback
 */
Fader.prototype.hide = function(animOptions, onComplete) {
    this._printDebug("Hiding with options: " + JSON.stringify(animOptions || {}));
    this._animate("out", animOptions, onComplete);
};

/**
 * Toggles visibility
 * @param {Object} animOptions - Animation options
 * @param {function} onComplete - Completion callback
 */
Fader.prototype.toggle = function(animOptions, onComplete) {
    this._printDebug("Toggling - current visibility: " + this.isCurrentlyVisible);
    if (this.isCurrentlyVisible) {
        this.hide(animOptions, onComplete);
    } else {
        this.show(animOptions, onComplete);
    }
};

/**
 * Stops all running animations
 */
Fader.prototype.stop = function() {
    this._cancelAllAnimations();
}

/**
 * Sets alpha instantly without animation
 * @param {number} alpha - Alpha value (0-1)
 */
Fader.prototype.setAlpha = function(alpha) {
    this._cancelAllAnimations();
    var param = this.scriptSettings.inFadeMaterialParameter;
    var recursive = this.scriptSettings.inRecursiveFade;
    this._setAlpha(this.sceneObj, alpha, recursive, param);
};

/**
 * Sets scale instantly without animation
 * @param {vec3} scale - Scale value
 * @param {string} local - "Local" or "World"
 */
Fader.prototype.setScale = function(scale, local) {
    this._cancelAllAnimations();
    local = local || "Local";
    this._setScale(scale, local);
};

/**
 * Sets screen transform rect instantly without animation
 * @param {vec4} rect - Rect value (left, right, top, bottom)
 */
Fader.prototype.setRect = function(rect) {
    this._cancelAllAnimations();
    this._setRect(rect);
};

/**
 * Checks if the fader is currently visible
 * @returns {boolean}
 */
Fader.prototype.isVisible = function() {
    return this.isCurrentlyVisible && this.sceneObj.enabled;
};

/**
 * Checks if any animations are running
 * @returns {boolean}
 */
Fader.prototype.isAnimating = function() {
    return this.animations.length > 0;
};

/**
 * Invalidates the component cache (call this if components are added/removed at runtime)
 */
Fader.prototype.refreshCache = function() {
    this._printDebug("Refreshing component cache");
    this._componentCache = null;
    this._cacheComponents();
};

// ============ FADER INTERNAL METHODS ============

Fader.prototype._cacheComponents = function() {
    this._printDebug("Caching components...");
    
    //TODO: option to make materials unique

    this._componentCache = {
        // mainPass components (support baseColor parameter)
        meshes: this.sceneObj.getComponents("Component.RenderMeshVisual"),
        images: this.sceneObj.getComponents("Component.Image"),
        text3D: this.sceneObj.getComponents("Component.Text3D"),
        postEffects: this.sceneObj.getComponents("Component.PostEffectVisual"),
        
        // Text components (use textFill.color)
        texts: this.sceneObj.getComponents("Component.Text"),
        
        // Transform components
        screenTransform: this.sceneObj.getComponent("Component.ScreenTransform"),
        transform: this.sceneObj.getTransform(),
        
        // Combined mainPass components for quick iteration
        mainPass: []
    };

    if (this.makeMaterialsUnique) {
        this._makeComponentMaterialsUnique();
    }
    
    // Create combined mainPass array
    // Add all materials from meshes
    for (var i = 0; i < this._componentCache.meshes.length; i++) {
        var mesh = this._componentCache.meshes[i];
        var materialCount = mesh.getMaterialsCount();
        
        for (var j = 0; j < materialCount; j++) {
            var material = mesh.getMaterial(j);
            this._componentCache.mainPass.push(material);
        }
    }
    
    // Add images and text3D directly
    this._componentCache.mainPass = this._componentCache.mainPass.concat(
        this._componentCache.images,
        this._componentCache.text3D,
        this._componentCache.postEffects
    );
    
    this._printDebug("" + this._componentCache.mainPass.length + " mainPass components cached");
};

Fader.prototype._makeComponentMaterialsUnique = function() {
    this._printDebug("Making materials unique...");
    
    // Handle meshes (each can have multiple materials)
    for (var i = 0; i < this._componentCache.meshes.length; i++) {
        var mesh = this._componentCache.meshes[i];
        var materialCount = mesh.getMaterialsCount();
        var clonedMaterials = [];
        
        // Clone all materials from this mesh
        for (var j = 0; j < materialCount; j++) {
            var originalMaterial = mesh.getMaterial(j);
            var clonedMaterial = originalMaterial.clone();
            clonedMaterials.push(clonedMaterial);
        }
        
        // Replace with cloned materials
        mesh.clearMaterials();
        for (var k = 0; k < clonedMaterials.length; k++) {
            mesh.addMaterial(clonedMaterials[k]);
        }
    }
    
    // Handle images (single material each)
    for (var i = 0; i < this._componentCache.images.length; i++) {
        var image = this._componentCache.images[i];
        var clonedMaterial = image.mainMaterial.clone();
        image.mainMaterial = clonedMaterial;
    }
    
    // Handle text3D (single material each)
    for (var i = 0; i < this._componentCache.text3D.length; i++) {
        var text3D = this._componentCache.text3D[i];
        var clonedMaterial = text3D.mainMaterial.clone();
        text3D.mainMaterial = clonedMaterial;
    }

    // Handle postEffects (single material each)
    for (var i = 0; i < this._componentCache.postEffects.length; i++) {
        var postEffect = this._componentCache.postEffects[i];
        var clonedMaterial = postEffect.mainMaterial.clone();
        postEffect.mainMaterial = clonedMaterial;
    }
    
    this._printDebug("Materials made unique");
};

Fader.prototype._resetOtherModes = function(mode, direction) {
    var oppositeDirection = direction === "in" ? "out" : "in";
    var oppositeMode = this.scriptSettings[oppositeDirection + "Mode"];
    
    // If modes are the same, no reset is needed
    if (mode === oppositeMode) { return; }
    
    // Reset opposite mode to visible state (always "in")
    var oppositeKey = MODE_KEYS[oppositeMode];
    if (oppositeKey) {
        this._setValue(oppositeMode, "in", this.scriptSettings["in" + oppositeKey]);
    }
    
    // Reset current mode to its start state (opposite direction)
    var currentKey = MODE_KEYS[mode];
    if (currentKey) {
        this._setValue(mode, oppositeDirection, this.scriptSettings[oppositeDirection + currentKey]);
    }
};

Fader.prototype._animate = function(direction, animOptions, onComplete) {
    // Handle callback shorthand
    if (typeof animOptions === "function") {
        onComplete = animOptions;
        animOptions = {};
    }
    animOptions = animOptions || {};

    // Get settings
    var time = animOptions.time !== undefined ? animOptions.time : this.scriptSettings[direction + "Time"];
    var delay = animOptions.delay !== undefined ? animOptions.delay : 0;
    var mode = animOptions.mode || this.scriptSettings[direction + "Mode"];
    var cancel = animOptions.cancel || "all";
    
    this._printDebug("Animation settings - direction: " + direction + ", time: " + time + ", delay: " + delay + ", mode: " + mode + ", cancel: " + cancel);
    
    // Handle cancellation
    if (cancel === "all") {
        this._cancelAllAnimations();
    } else if (cancel === "active") {
        this._cancelActiveAnimations();
    }

    // Update visibility state
    this.isCurrentlyVisible = direction === "in";

    // Get animation parameters based on mode
    var startVal = this._getValue(mode, direction);
    var endVal;
    if (mode === "fade") {
        endVal = this.scriptSettings[direction + "Alpha"];
        this._printDebug("Fade animation - from: " + startVal + " to: " + endVal);
    } else if (mode === "scale") {
        var isLocal = this.scriptSettings[direction + "ScaleLocal"] === "Local";
        endVal = this.scriptSettings[direction + "Scale"];
        this._printDebug("Scale animation - from: " + startVal.toString() + " to: " + endVal.toString() + ", local: " + isLocal);
    } else if (mode === "slide") {
        endVal = this.scriptSettings[direction + "Rect"];
        this._printDebug("Slide animation - from: " + startVal.toString() + " to: " + endVal.toString());
    } else {
        this._printWarning("Unknown mode '" + mode + "', defaulting to fade");
        endVal = this.scriptSettings[direction + "Alpha"];
        mode = "fade";
    }

    // Create easing string
    var easingFunc = this.scriptSettings[direction + "Easing"];
    var easingType = this.scriptSettings[direction + "EasingType"];
    var easing = easingFunc + easingType;

    this._printDebug("Creating Animation with easing: " + easing);

    var fader = this;
    
    var animation = new Animation(
        startVal,
        endVal,
        time,
        delay,
        easing,
        function(val, easedT, linearT) {
            // onUpdate callback - apply the value
            fader._setValue(mode, direction, val);
        },
        function() {
            // onStart callback
            fader._enableObj(direction);

            fader._resetOtherModes(mode, direction);
        
            this.startVal = fader._getValue(mode, direction);
            fader._printDebug("Fetched latest start value: " + this.startVal);

            if (animOptions.onStart) {
                fader._printDebug("Calling animOptions onStart callback");
                animOptions.onStart();
            }
        },
        function() {
            // onComplete callback
            
            // Remove from active animations
            var index = fader.animations.indexOf(animation);
            if (index > -1) {
                fader.animations.splice(index, 1);
                fader._printDebug("Animation removed from list - remaining: " + fader.animations.length);
            }
            
            fader._onAnimationComplete(direction, [onComplete, animOptions.onComplete]);
        }
    );

    if (time > 0 || delay > 0) {
        this.animations.push(animation);
        this._printDebug("Animation added to list - total: " + this.animations.length);
    } else {
        this._printDebug("Instant animation - not tracking in list");
    }
};

Fader.prototype._onAnimationComplete = function(direction, onCompleteFunctions) {
    this._disableObj(direction);
    
    onCompleteFunctions.forEach(onComplete => {
        if (onComplete) {
            this._printDebug("Calling onComplete callback");
            onComplete();
        }
    });
}

Fader.prototype._disableObj = function(direction) {
    if (direction === "out" && this.disableWhenHidden) {
        this._printDebug("Disabling scene object");
        this.sceneObj.enabled = false;
    }
}

Fader.prototype._enableObj = function(direction) {
    // Enable object if showing and was disabled
    if (direction === "in" && this.disableWhenHidden && !this.sceneObj.enabled) {
        this._printDebug("Re-enabling scene object");
        this.sceneObj.enabled = true;
    }
}

Fader.prototype._getValue = function(mode, direction) {
    var isIn = direction === "in";

    switch (mode) {
        case "fade":
            var alpha = this._getAlpha(direction);
            return alpha !== null ? alpha : (isIn ? this.scriptSettings.outAlpha : this.scriptSettings.inAlpha);
        case "scale":
            var scale = this._getScale(this.scriptSettings[direction + "ScaleLocal"]);
            return scale !== null ? scale : (isIn ? this.scriptSettings.outScale : this.scriptSettings.inScale);
        case "slide":
            var rect = this._getRect();
            return rect !== null ? rect : (isIn ? this.scriptSettings.outRect : this.scriptSettings.inRect);
        default:
            return isIn ? 0 : 1;
    }
};

Fader.prototype._setValue = function(mode, direction, value) {
    switch (mode) {
        case "scale":
            this._setScale(value, this.scriptSettings[direction + "ScaleLocal"]);
            break;
        case "slide":
            this._setRect(value);
            break;
        case "fade":
        default:
            var recursive = this.scriptSettings[direction + "RecursiveFade"];
            var parameter = this.scriptSettings[direction + "FadeMaterialParameter"];
            this._setAlpha(this.sceneObj, value, recursive, parameter);
            break;
    }
};

Fader.prototype._setAlpha = function(obj, alpha, recursive, parameter) {
    // For the root object, use cached components
    if (this._componentCache && this.sceneObj.isSame(obj)) {
        //this._printDebug("Setting alpha to: " + alpha);

        // Apply to all mainPass components
        for (var i = 0; i < this._componentCache.mainPass.length; i++) {
            var comp = this._componentCache.mainPass[i];
            
            if (parameter === "baseColor") {
                var color = comp.mainPass[parameter];
                if (color) {
                    comp.mainPass[parameter] = new vec4(color.r, color.g, color.b, alpha);
                }
            } else {
                comp.mainPass[parameter] = alpha;
            }
        }
        
        // Apply to Text components
        for (var j = 0; j < this._componentCache.texts.length; j++) {
            var textColor = this._componentCache.texts[j].textFill.color;
            this._componentCache.texts[j].textFill.color = new vec4(textColor.r, textColor.g, textColor.b, alpha);
            
            var outlineColor = this._componentCache.texts[j].outlineSettings.fill.color;
            this._componentCache.texts[j].outlineSettings.fill.color = new vec4(outlineColor.r, outlineColor.g, outlineColor.b, alpha);
            
            var shadowColor = this._componentCache.texts[j].shadowColor;
            this._componentCache.texts[j].shadowColor = new vec4(shadowColor.r, shadowColor.g, shadowColor.b, alpha);
        }
    } else {
        // For child objects during recursion, use normal getComponents
        var meshComponents = obj.getComponents("Component.RenderMeshVisual");
        var imageComponents = obj.getComponents("Component.Image");
        var text3DComponents = obj.getComponents("Component.Text3D");
        var postEffectComponents = obj.getComponents("Component.PostEffectVisual");
                
        var mainPassComponents = [];
        
        // Add all materials from meshes
        for (var i = 0; i < meshComponents.length; i++) {
            var mesh = meshComponents[i];
            var materialCount = mesh.getMaterialsCount();
            
            for (var j = 0; j < materialCount; j++) {
                var material = mesh.getMaterial(j);
                mainPassComponents.push(material);
            }
        }

        // Add images and text3D directly
        mainPassComponents = mainPassComponents.concat(
            imageComponents,
            text3DComponents,
            postEffectComponents
        );
        
        for (var i = 0; i < mainPassComponents.length; i++) {
            var comp = mainPassComponents[i];
            
            if (parameter === "baseColor") {
                var color = comp.mainPass[parameter];
                if (color) {
                    comp.mainPass[parameter] = new vec4(color.r, color.g, color.b, alpha);
                }
            } else {
                comp.mainPass[parameter] = alpha;
            }
        }
        
        var textComponents = obj.getComponents("Component.Text");
        for (var j = 0; j < textComponents.length; j++) {
            var textColor = textComponents[j].textFill.color;
            textComponents[j].textFill.color = new vec4(textColor.r, textColor.g, textColor.b, alpha);
            
            var outlineColor = textComponents[j].outlineSettings.fill.color;
            textComponents[j].outlineSettings.fill.color = new vec4(outlineColor.r, outlineColor.g, outlineColor.b, alpha);
            
            var shadowColor = textComponents[j].shadowColor;
            textComponents[j].shadowColor = new vec4(shadowColor.r, shadowColor.g, shadowColor.b, alpha);
        }
    }
    
    // Recursively apply to children
    if (recursive) {
        for (var c = 0; c < obj.getChildrenCount(); c++) {
            this._setAlpha(obj.getChild(c), alpha, true, parameter);
        }
    }
};

Fader.prototype._getAlpha = function(direction) {
    if (!this._componentCache) return null;
    
    // Try mainPass components first
    var mainPassComp = null;
    if (this._componentCache.mainPass.length > 0) {
        mainPassComp = this._componentCache.mainPass[0];
    }
    
    if (mainPassComp) {
        var param = this.scriptSettings[direction + "FadeMaterialParameter"];
        
        if (param === "baseColor") {
            var color = mainPassComp.mainPass[param];
            if (color && color.a !== undefined) {
                return color.a;
            }
        } else {
            var value = mainPassComp.mainPass[param];
            if (value !== undefined && value !== null) {
                return value;
            }
        }
    }
    
    // Try Text component
    if (this._componentCache.texts.length > 0) {
        var textColor = this._componentCache.texts[0].textFill.color;
        if (textColor && textColor.a !== undefined) {
            return textColor.a;
        }
    }
    
    return null;
};

Fader.prototype._setScale = function(scale, local) {
    //this._printDebug("Setting Scale to: " + scale);

    local = local || "Local";
    
    if (this._componentCache.screenTransform) {
        this._componentCache.screenTransform.scale = scale;
    } else if (this._componentCache.transform) {
        this._componentCache.transform["set" + local + "Scale"](scale);
    }
};

Fader.prototype._getScale = function(local) {
    local = local || "Local";

    if (this._componentCache.screenTransform) {
        return this._componentCache.screenTransform.scale;
    } else if (this._componentCache.transform) {
        return this._componentCache.transform["get" + local + "Scale"]();
    }
    
    return null;
};

Fader.prototype._setRect = function(rect) {
    if (this._componentCache.screenTransform) {
        //this._printDebug("Setting ScreenTransform anchors to: " + rect);

        this._componentCache.screenTransform.anchors.left = rect.x;
        this._componentCache.screenTransform.anchors.right = rect.y;
        this._componentCache.screenTransform.anchors.bottom = rect.z;
        this._componentCache.screenTransform.anchors.top = rect.w;
    }
};

Fader.prototype._getRect = function() {
    if (this._componentCache.screenTransform) {
        return new vec4(
            this._componentCache.screenTransform.anchors.left,
            this._componentCache.screenTransform.anchors.right,
            this._componentCache.screenTransform.anchors.bottom,
            this._componentCache.screenTransform.anchors.top
        );
    }
    return null;
};

Fader.prototype._cancelAllAnimations = function() {
    if (this.animations.length < 1) { return; }
    
    this._printDebug("Canceling all " + this.animations.length + " animations");
    
    for (var i = this.animations.length - 1; i >= 0; i--) {
        this.animations[i].stop();
    }
    this.animations = [];
};

Fader.prototype._cancelActiveAnimations = function() {
    if (this.animations.length < 1) { return; }
    
    var cancelCount = 0;
    for (var i = this.animations.length - 1; i >= 0; i--) {
        if (this.animations[i].animationStarted) {
            this.animations[i].stop();
            this.animations.splice(i, 1);
            cancelCount++;
        }
    }
    
    this._printDebug("Canceled " + cancelCount + " active animations");
};

Fader.prototype._printDebug = function(message) {
    if (script.printDebugStatements) {
        var newLog = "Fader " + this.name + " - " + message;
        if (global.textLogger) { global.logToScreen(newLog); }
        print(newLog);
    }
}

Fader.prototype._printWarning = function(message) {
    if (script.printWarningStatements) {
        var warningLog = "Fader " + this.name + " - WARNING, " + message;
        if (global.textLogger) { global.logError(warningLog); }
        print(warningLog);
    }
}

// ============ FADER MANAGER CLASS ============

/**
 * FaderManager manages all Fader instances
 */
var FaderManager = function() {
    this.faders = {}; // name -> [Fader]
    this.fadersByTag = {}; // tag -> [Fader]
};

/**
 * Adds a fader to the manager
 * @param {Fader} fader - Fader instance to add
 */
FaderManager.prototype.add = function(fader) {
    this._printDebug("Adding fader: " + fader.name);
    
    // Add by name
    if (!this.faders[fader.name]) {
        this.faders[fader.name] = [];
    }
    this.faders[fader.name].push(fader);
    
    // Add by tags
    for (var i = 0; i < fader.tags.length; i++) {
        var tag = fader.tags[i];
        if (!this.fadersByTag[tag]) {
            this.fadersByTag[tag] = [];
        }
        this.fadersByTag[tag].push(fader);
        this._printDebug("Fader added to tag: " + tag);
    }
};

/**
 * Removes a fader from the manager
 * @param {Fader} fader - Fader instance to remove
 */
FaderManager.prototype.remove = function(fader) {
    this._printDebug("Removing fader: " + fader.name);
    
    // Remove from name list
    if (this.faders[fader.name]) {
        var index = this.faders[fader.name].indexOf(fader);
        if (index > -1) {
            this.faders[fader.name].splice(index, 1);
        }
    }
    
    // Remove from tag lists
    for (var i = 0; i < fader.tags.length; i++) {
        var tag = fader.tags[i];
        if (this.fadersByTag[tag]) {
            var tagIndex = this.fadersByTag[tag].indexOf(fader);
            if (tagIndex > -1) {
                this.fadersByTag[tag].splice(tagIndex, 1);
            }
        }
    }
};

/**
 * Shows one or more faders
 * @param {string|string[]|SceneObject|SceneObject[]} identifier - Name, tag, SceneObject, or array of any
 * @param {Object|function} animOptions - Animation options or callback function
 * @param {function} onComplete - Completion callback (if animOptions is an object)
 */
FaderManager.prototype.show = function(identifier, animOptions, onComplete) {
    this._executeFaderMethod('show', identifier, animOptions, onComplete);
};

/**
 * Hides one or more faders
 * @param {string|string[]|SceneObject|SceneObject[]} identifier - Name, tag, SceneObject, or array of any
 * @param {Object|function} animOptions - Animation options or callback function
 * @param {function} onComplete - Completion callback (if animOptions is an object)
 */
FaderManager.prototype.hide = function(identifier, animOptions, onComplete) {
    this._executeFaderMethod('hide', identifier, animOptions, onComplete);
};

/**
 * Toggles one or more faders
 * @param {string|string[]|SceneObject|SceneObject[]} identifier - Name, tag, SceneObject, or array of any
 * @param {Object|function} animOptions - Animation options or callback function
 * @param {function} onComplete - Completion callback (if animOptions is an object)
 */
FaderManager.prototype.toggle = function(identifier, animOptions, onComplete) {
    this._executeFaderMethod('toggle', identifier, animOptions, onComplete);
};

/**
 * Stops all animations on specified faders
 * @param {string|string[]|SceneObject|SceneObject[]} identifier - Name, tag, SceneObject, or array of any
 */
FaderManager.prototype.stop = function(identifier) {
    this._printDebug("Stopping with identifier: " + identifier);
    
    var faders = this._resolveFaders(identifier);
    if (faders.length < 1){ return; }
    this._printDebug("Stopping " + faders.length + " fader(s)");
    
    for (var i = 0; i < faders.length; i++) {
        faders[i].cancel();
    }
};

/**
 * Sets alpha instantly on specified faders
 * @param {string|string[]|SceneObject|SceneObject[]} identifier - Name, tag, SceneObject, or array of any
 * @param {number} alpha - Alpha value (0-1)
 */
FaderManager.prototype.setAlpha = function(identifier, alpha) {
    this._printDebug("Setting alpha with identifier: " + identifier + ", alpha: " + alpha);
    
    var faders = this._resolveFaders(identifier);
    if (faders.length < 1){ return; }
    this._printDebug("Setting alpha on " + faders.length + " fader(s)");
    
    for (var i = 0; i < faders.length; i++) {
        faders[i].setAlpha(alpha);
    }
};

// ============ FADER MANAGER INTERNAL METHODS ============

/**
 * Helper method to execute a fader method on resolved faders with proper callback handling
 * @param {string} methodName - The fader method to call ('show', 'hide', 'toggle')
 * @param {string|string[]|SceneObject|SceneObject[]} identifier - Name, tag, SceneObject, or array of any
 * @param {Object|function} animOptions - Animation options or callback function
 * @param {function} onComplete - Completion callback (if animOptions is an object)
 */
FaderManager.prototype._executeFaderMethod = function(methodName, identifier, animOptions, onComplete) {
    this._printDebug(methodName + " called with identifier: " + identifier);
    
    var faders = this._resolveFaders(identifier);
    if (faders.length < 1){ return; }
    this._printDebug("Resolved " + faders.length + " fader(s)");
    
    // Handle callback shorthand
    if (typeof animOptions === "function") {
        onComplete = animOptions;
        animOptions = {};
    }
    
    // Single fader optimization
    if (faders.length === 1) {
        faders[0][methodName](animOptions, onComplete);
        return;
    }
    
    // Create muted options for subsequent faders
    var mutedAnimOptions = {};
    for (var key in animOptions) {
        if (animOptions.hasOwnProperty(key)) {
            mutedAnimOptions[key] = animOptions[key];
        }
    }
    delete mutedAnimOptions.onComplete;
    delete mutedAnimOptions.onStart;
    
    // Execute method on all faders
    for (var i = 0; i < faders.length; i++) {
        faders[i][methodName](i === 0 ? animOptions : mutedAnimOptions, i === 0 ? onComplete : null);
    }
};

/**
 * Resolves identifiers to fader instances
 * @param {string|string[]|SceneObject|SceneObject[]|null} identifier
 * @returns {Fader[]} Array of matching faders
 */
FaderManager.prototype._resolveFaders = function(identifier) {
    if (identifier === undefined) {
        this._printWarning("Failed to resolve - identifier undefined");
        return [];
    }
    
    var result = [];
    var added = {};
    
    // Helper to add unique faders
    var addUnique = function(fader) {
        var key = fader.sceneObj.uniqueIdentifier;
        if (!added[key]) {
            result.push(fader);
            added[key] = true;
        }
    };
    
    // If null/undefined, return all faders
    if (identifier === null) {
        this._printDebug("Identifier is null - returning all faders");
        for (var key in this.faders) {
            var faderList = this.faders[key];
            for (var i = 0; i < faderList.length; i++) {
                addUnique(faderList[i]);
            }
        }
        return result;
    }
    
    // Handle array of identifiers
    if (identifier.length !== undefined && typeof identifier !== "string") {
        for (var a = 0; a < identifier.length; a++) {
            var subFaders = this._resolveSingleIdentifier(identifier[a]);
            for (var s = 0; s < subFaders.length; s++) {
                addUnique(subFaders[s]);
            }
        }
        return result;
    }
    
    // Handle single identifier
    return this._resolveSingleIdentifier(identifier);
};

/**
 * Resolves a single identifier to fader instances
 * @param {string|SceneObject} identifier
 * @returns {Fader[]} Array of matching faders
 */
FaderManager.prototype._resolveSingleIdentifier = function(identifier) {    
    // Handle SceneObject - find by reference
    if (identifier && identifier.getTypeName && identifier.getTypeName() === "SceneObject") {
        var result = [];
        for (var name in this.faders) {
            var faderList = this.faders[name];
            for (var i = 0; i < faderList.length; i++) {
                if (faderList[i].sceneObj.isSame(identifier)) {
                    result.push(faderList[i]);
                }
            }
        }
        return result;
    }
    
    // Handle string (could be name or tag)
    if (typeof identifier === "string") {
        var faders = [];
        
        // Check if it's a direct name match
        if (this.faders[identifier]) {
            faders = faders.concat(this.faders[identifier]);
        }
        
        // Check if it's a tag
        if (this.fadersByTag[identifier]) {
            // Add tagged faders that aren't already in the list
            var taggedFaders = this.fadersByTag[identifier];
            for (var i = 0; i < taggedFaders.length; i++) {
                var found = false;
                for (var j = 0; j < faders.length; j++) {
                    if (faders[j] === taggedFaders[i]) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    faders.push(taggedFaders[i]);
                }
            }
        }
        
        return faders;
    }
    
    return [];
};

FaderManager.prototype._printDebug = function(message) {
    if (script.printDebugStatements) {
        var newLog = "FaderManager - " + message;
        if (global.textLogger) { global.logToScreen(newLog); }
        print(newLog);
    }
}

FaderManager.prototype._printWarning = function(message) {
    if (script.printWarningStatements) {
        var warningLog = "FaderManager - WARNING, " + message;
        if (global.textLogger) { global.logError(warningLog); }
        print(warningLog);
    }
}

// ============ ANIMATION CLASS ============

/**
 * Animation class handles interpolation between values over time with easing
 * @param {*} startVal - Starting value (number, vec2, vec3, or vec4)
 * @param {*} endVal - Ending value (must match startVal type)
 * @param {number} time - Duration in seconds
 * @param {number} delay - Delay before starting in seconds
 * @param {string} easing - Easing function name
 * @param {function} onUpdate - Called each frame with (currentValue, easedT, linearT)
 * @param {function} onStart - Called when animation starts (after delay)
 * @param {function} onComplete - Called when animation completes
 */
var Animation = function(startVal, endVal, time, delay, easing, onUpdate, onStart, onComplete) {
    this.id = this._makeId(4);
    
    this.startVal = startVal;
    this.endVal = endVal;
    this.time = time;
    this.delay = delay;
    this.easing = easing;
    this.onUpdate = onUpdate;
    this.onStart = onStart;
    this.onComplete = onComplete;
    
    this.inDelayPhase = delay > 0;
    this.animationStarted = false;
    this.elapsed = 0;
    this.delayElapsed = 0;
    this.updateEvent = null;
    this.currentValue = startVal;
    
    this._printDebug("Animation created - startVal: " + startVal + ", endVal: " + endVal + ", time: " + time + ", delay: " + delay + ", easing: " + easing);
    this._start();
};

Animation.prototype._start = function() {
    this._printDebug("Animation starting");
    var anim = this;
    
    // Determine value type
    var isVec2 = this.startVal && this.startVal.x !== undefined && this.startVal.y !== undefined && this.startVal.z === undefined && this.startVal.w === undefined;
    var isVec3 = this.startVal && this.startVal.x !== undefined && this.startVal.z !== undefined && this.startVal.w === undefined;
    var isVec4 = this.startVal && this.startVal.w !== undefined;

    var valueType = isVec4 ? "vec4" : (isVec3 ? "vec3" : (isVec2 ? "vec2" : "float"));
    
    this._printDebug("Value type detected: " + valueType);
    
    // Handle instant animation (no delay, no time)
    if (this.delay === 0 && this.time === 0) {
        this._printDebug("Instant animation detected - executing immediately");
        this.animationStarted = true;
        
        // Set current value to end value
        this.currentValue = this.endVal;
        
        // Call callbacks in order: onStart -> onUpdate -> onComplete
        if (this.onStart) {
            this._printDebug("Calling onStart callback");
            this.onStart();
        }
        
        if (this.onUpdate) {
            this._printDebug("Calling onUpdate callback with end value");
            this.onUpdate(this.currentValue, 1, 1);
        }
        
        if (this.onComplete) {
            this._printDebug("Calling onComplete callback");
            this.onComplete();
        }
        
        return; // Skip creating update event
    }
    
    this.updateEvent = script.createEvent("UpdateEvent");
    this.updateEvent.bind(function(eventData) {
        var dt = eventData.getDeltaTime();
        
        // Handle delay phase
        if (anim.inDelayPhase) {
            anim.delayElapsed += dt;
            
            if (anim.delayElapsed >= anim.delay) {
                anim._printDebug("Animation delay complete - starting animation");
                anim.inDelayPhase = false;
                anim.animationStarted = true;
                if (anim.onStart) {
                    anim._printDebug("Calling onStart callback");
                    anim.onStart();
                }
            }
            return;
        }
        
        // Handle animation
        if (!anim.animationStarted) {
            anim._printDebug("Animation starting immediately (no delay)");
            anim.animationStarted = true;
            if (anim.onStart) {
                anim._printDebug("Calling onStart callback");
                anim.onStart();
            }
        }
        
        anim.elapsed += dt;
        var linearT = anim.time > 0 ? Math.min(anim.elapsed / anim.time, 1) : 1;
        var easedT = anim.time > 0 ? anim._ease(linearT) : 1;
        
        // Interpolate based on type
        if (isVec4) {
            anim.currentValue = new vec4(
                anim._lerp(anim.startVal.x, anim.endVal.x, easedT),
                anim._lerp(anim.startVal.y, anim.endVal.y, easedT),
                anim._lerp(anim.startVal.z, anim.endVal.z, easedT),
                anim._lerp(anim.startVal.w, anim.endVal.w, easedT)
            );
        } else if (isVec3) {
            anim.currentValue = new vec3(
                anim._lerp(anim.startVal.x, anim.endVal.x, easedT),
                anim._lerp(anim.startVal.y, anim.endVal.y, easedT),
                anim._lerp(anim.startVal.z, anim.endVal.z, easedT)
            );
        } else if (isVec2) {
            anim.currentValue = new vec2(
                anim._lerp(anim.startVal.x, anim.endVal.x, easedT),
                anim._lerp(anim.startVal.y, anim.endVal.y, easedT)
            );
        } else {
            anim.currentValue = anim._lerp(anim.startVal, anim.endVal, easedT);
        }
        
        if (anim.onUpdate) {
            anim.onUpdate(anim.currentValue, easedT, linearT);
        }
        
        // Complete animation
        if (linearT >= 1) {
            anim._printDebug("Animation complete");
            anim.stop();
            if (anim.onComplete) {
                anim._printDebug("Calling onComplete callback");
                anim.onComplete();
            }
        }
    });
    
    this._printDebug("Animation update event bound");
};

Animation.prototype.stop = function() {
    this._printDebug("Animation stopping");
    if (this.updateEvent) {
        script.removeEvent(this.updateEvent);
        this.updateEvent = null;
        this._printDebug("Update event removed");
    }
};

Animation.prototype._lerp = function(a, b, t) {
    return a + (b - a) * t;
};

Animation.prototype._ease = function(t) {
    // Use global easing utility
    if (!global.easing) {
        this._printWarning("global.easing not found. Please import the easing utility script.");
        return t;
    }
    
    var easingMap = {
        "Linear": "linear",
        "QuadraticIn": "easeInQuad",
        "QuadraticOut": "easeOutQuad",
        "QuadraticInOut": "easeInOutQuad",
        "CubicIn": "easeInCubic",
        "CubicOut": "easeOutCubic",
        "CubicInOut": "easeInOutCubic",
        "QuarticIn": "easeInQuart",
        "QuarticOut": "easeOutQuart",
        "QuarticInOut": "easeInOutQuart",
        "QuinticIn": "easeInQuint",
        "QuinticOut": "easeOutQuint",
        "QuinticInOut": "easeInOutQuint",
        "SinusoidalIn": "easeInSine",
        "SinusoidalOut": "easeOutSine",
        "SinusoidalInOut": "easeInOutSine",
        "ExponentialIn": "easeInExpo",
        "ExponentialOut": "easeOutExpo",
        "ExponentialInOut": "easeInOutExpo",
        "CircularIn": "easeInCirc",
        "CircularOut": "easeOutCirc",
        "CircularInOut": "easeInOutCirc",
        "BackIn": "easeInBack",
        "BackOut": "easeOutBack",
        "BackInOut": "easeInOutBack",
        "ElasticIn": "easeInElastic",
        "ElasticOut": "easeOutElastic",
        "ElasticInOut": "easeInOutElastic",
        "BounceIn": "easeInBounce",
        "BounceOut": "easeOutBounce",
        "BounceInOut": "easeInOutBounce"
    };
    
    var easingFunc = easingMap[this.easing];
    if (easingFunc && global.easing[easingFunc]) {
        return global.easing[easingFunc](t);
    }
    
    this._printWarning("Easing function '" + this.easing + "' not found in global.easing, falling back to linear");
    return t;
};

Animation.prototype._makeId = function(len) {
    var result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const charactersLength = characters.length;
    var counter = 0;
    while (counter < len) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}

Animation.prototype._printDebug = function(message) {
    if (script.printDebugStatements) {
        var newLog = "Animation " + this.id + " - " + message;
        if (global.textLogger) { global.logToScreen(newLog); }
        print(newLog);
    }
}

Animation.prototype._printWarning = function(message) {
    if (script.printWarningStatements) {
        var warningLog = "Animation " + this.id + " - WARNING, " + message;
        if (global.textLogger) { global.logError(warningLog); }
        print(warningLog);
    }
}

// ===== Debug Functions =====
var sceneObject = script.getSceneObject();

function printDebug(message) {
    if (script.printDebugStatements) {
        var newLog = "" + sceneObject.name + " - " + message;
        if (global.textLogger) { global.logToScreen(newLog); }
        print(newLog);
    }
}

function printWarning(message) {
    if (script.printWarningStatements) {
        var warningLog = "" + sceneObject.name + " - WARNING, " + message;
        if (global.textLogger) { global.logError(warningLog); }
        print(warningLog);
    }
}

// ============ INITIALIZATION ============

function init() {
    printDebug("Fader Initialization Start!");

    if (!global.easing) {
        printWarning("global.easing not found. Please import the easing utility script.");
    }
    
    // Create global faderManager instance if not exists
    if (!global.faderManager) {
        printDebug("Creating new FaderManager instance");
        global.faderManager = new FaderManager();
    } else {
        printDebug("Using existing FaderManager instance");
    }
    
    // Get scene object (use optional input or script's own object)
    var sceneObject = script.sceneObject ? script.sceneObject : script.getSceneObject();
    printDebug("SceneObject: " + sceneObject.name);
    
    if (script.disableWhenHidden && sceneObject.isSame(script.getSceneObject())) {
        printWarning("disableWhenHidden is enabled but sceneObject is set to the script's own object. This will disable the script itself when hidden, preventing it from being shown again. Set sceneObject to a different object (e.g., a child object) or turn off disableWhenHidden.");
    }
    
    // Build settings from script inputs
    var scriptSettings = {
        inMode: script.inMode,
        inTime: script.inTime,
        inAlpha: script.inAlpha,
        inScale: script.inScale,
        inRect: script.inRect,
        inEasing: script.inEasing,
        inEasingType: script.inEasingType,
        inRecursiveFade: script.inRecursiveFade,
        inFadeMaterialParameter: script.inFadeMaterialParameter,
        inScaleLocal: script.inScaleLocal,
        outMode: script.outMode,
        outTime: script.outTime,
        outAlpha: script.outAlpha,
        outScale: script.outScale,
        outRect: script.outRect,
        outEasing: script.outEasing,
        outEasingType: script.outEasingType,
        outRecursiveFade: script.outRecursiveFade,
        outFadeMaterialParameter: script.outFadeMaterialParameter,
        outScaleLocal: script.outScaleLocal
    };
    
    printDebug("Script settings configured - inMode: " + scriptSettings.inMode + ", outMode: " + scriptSettings.outMode);
    
    // Build options
    var faderOptions = {
        name: script.faderName || null,
        tags: script.faderTags || [],
        disableWhenHidden: script.disableWhenHidden,
        makeMaterialsUnique: script.makeMaterialsUnique
    };
    
    // Create new Fader instance
    printDebug("Creating new Fader instance...");
    var newFader = new Fader(sceneObject, faderOptions, scriptSettings);

    // Set initial visibility
    newFader.isCurrentlyVisible = (script.initialState === "visible");
    printDebug("Initial state: " + script.initialState);
    
    if (script.initialState === "hidden") {
        newFader.hide({time: 0});
    }
    
    // Add fader to global faderManager
    printDebug("Adding fader to FaderManager");
    global.faderManager.add(newFader);
    
    // Auto show/hide functionality
    if (script.autoShow) {
        printDebug("Auto-show enabled with delay: " + script.autoShowDelay);
        newFader.show({
            delay: script.autoShowDelay,
            onComplete: function() {
                if (script.autoHide) {
                    printDebug("Auto-hide triggered with delay: " + script.autoHideDelay);
                    newFader.hide({delay: script.autoHideDelay});
                }
            }
        });
    } else {
        if (script.autoHide) {
            printDebug("Auto-hide triggered with delay: " + script.autoHideDelay);
            newFader.hide({delay: script.autoHideDelay});
        }
    }
    
    printDebug("Fader Initialization Complete!");
}

init();