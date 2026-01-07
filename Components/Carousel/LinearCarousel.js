/*
LinearCarousel.js
Version: 0.1.2
Description: Generalized carousel with drag-to-scroll and snap-to-element behavior.
             Supports both horizontal and vertical orientations.
             Delegates visual styling to individual CarouselElement scripts on each element.
Author: Bennyp3333 [https://benjamin-p.dev]

 ==== Usage ====
 1. Add this script to a controller SceneObject
 2. Choose between spawned or existing elements:
    - Spawned: Provide a template, parent, and array of textures
    - Existing: Provide an array of pre-configured SceneObjects
 3. Each element should have a CarouselElement.js script attached
 4. Configure spacing, animation speed, and interaction settings

 ==== Element Communication ====
 This script calls updateDistanceFromCenter(normalized, raw, isCenter) on each
 element's CarouselElement script every frame. Elements use these values to
 control their own scale, opacity, rotation, etc.

 ==== API ====
 - getSelectedIndex()           - Returns currently centered element index
 - getElement(index)            - Returns element object at index
 - getElements()                - Returns array of all elements
 - getElementCount()            - Returns total number of elements
 - selectElement(index, anim)   - Navigate to element (anim=true for animation)
 - next()                       - Navigate to next element
 - previous()                   - Navigate to previous element

 ==== Notes ====
 - Requires CarouselElement.js on each element for visual control
 - Uses SpawnManager (global.spawn) for spawned carousels
*/

//@ui {"widget":"label", "label":"Carousel Setup"}
//@input int startingIndex = 0 {"label":"Starting Index", "hint":"Which element to center on initialization"}
//@input float spacing = 0.3 {"widget":"slider", "min":0.1, "max":1.0, "step":0.05, "label":"Element Spacing", "hint":"Distance between elements in screen units"}
//@input string direction = "horizontal" {"widget":"combobox", "values":[{"label":"Horizontal", "value":"horizontal"}, {"label":"Vertical", "value":"vertical"}], "hint":"Carousel scroll orientation"}
//@input float animationSpeed = 8.0 {"widget":"slider", "min":1.0, "max":20.0, "step":0.5, "label":"Snap Animation Speed", "hint":"How fast the carousel snaps to elements"}

//@ui {"widget":"separator"}
//@ui {"widget":"label", "label":"Element Source"}
//@input bool spawnedCarousel = false {"label":"Spawned Carousel", "hint":"Toggle between spawning new elements or using existing ones"}

//@ui {"widget":"group_start", "label":"Spawned Elements", "showIf":"spawnedCarousel"}
//@input SceneObject elementTemplate {"label":"Element Template", "hint":"Disabled SceneObject to clone for each element"}
//@input SceneObject spawnParent {"label":"Spawn Parent", "hint":"Parent to spawn elements under"}
//@input Asset.Texture[] textures {"label":"Textures", "hint":"Array of textures, one per element"}
//@ui {"widget":"group_end"}

//@ui {"widget":"group_start", "label":"Existing Elements", "showIfValue":false, "showIf":"spawnedCarousel"}
//@input SceneObject[] elements {"label":"Elements", "hint":"Array of pre-existing SceneObjects"}
//@ui {"widget":"group_end"}

//@ui {"widget":"separator"}
//@ui {"widget":"label", "label":"Interaction"}
//@input SceneObject dragArea {"label":"Drag Area", "hint":"SceneObject with InteractionComponent for drag bounds (optional)"}
//@input float swipeSensitivity = 2.0 {"widget":"slider", "min":0.5, "max":10.0, "step":0.1, "label":"Swipe Sensitivity", "hint":"How much the carousel moves relative to finger movement"}
//@input bool enableTapToSelect = true {"label":"Enable Tap to Select", "hint":"Allow tapping elements to bring them to center"}
//@input float interactionCutoff = 2.5 {"widget":"slider", "min":1.0, "max":5.0, "step":0.5, "label":"Interaction Cutoff", "showIf":"enableTapToSelect" ,"hint":"Disable tap on elements beyond this distance (in spacing units)"}

//@ui {"widget":"separator"}
//@ui {"widget":"label", "label":"Wrapping"}
//@input float wrapBuffer = 0.0 {"widget":"slider", "min":0.0, "max":1.0, "step":0.1, "label":"Wrap Buffer", "hint":"Extra space before wrapping occurs"}

//@ui {"widget":"separator"}
//@ui {"widget":"label", "label":"Callbacks"}
//@input bool enableCallbacks = false {"label":"Enable Callbacks", "hint":"Toggle callback system"}
//@ui {"widget":"group_start", "label":"Callback Settings", "showIf":"enableCallbacks"}
//@input int callbackType = 0 {"widget":"combobox", "values":[{"label":"Global Function", "value":0}, {"label":"Custom Script", "value":1}], "hint":"Global function or custom script reference"}
//@input string onSelectGlobalFunction {"label":"Global Function Name", "showIf":"callbackType", "showIfValue":0, "hint":"Name of global function to call"}
//@input Component.ScriptComponent customScript {"label":"Custom Script", "showIf":"callbackType", "showIfValue":1, "hint":"Script component containing the callback function"}
//@input string onSelectFunction {"label":"Function Name", "showIf":"callbackType", "showIfValue":1, "hint":"Name of function on custom script"}
//@input bool callbackOnStart = true {"label":"Callback On Start", "showIf":"enableCallbacks", "hint":"Fire callback on initialization"}
//@ui {"widget":"group_end"}

//@ui {"widget":"separator"}
//@ui {"widget":"label", "label":"Audio"}
//@input Asset.AudioTrackAsset selectAudioTrack {"label":"Select Sound", "hint":"Sound to play when selection changes"}

//@ui {"widget":"separator"}
//@input bool enableLogging = false {"label":"Enable Debug Logging"}

// ============ STATE VARIABLES ============

var elements = [];           // Array of element objects: { obj, script, screenTransform, interaction }
var elementCount = 0;
var currentIndex = 0;        // Currently selected/centered element index
var carouselOffset = 0;      // Current offset of the entire carousel (in spacing units)
var targetOffset = 0;        // Target offset for snap animation
var isVertical = false;      // Direction flag (set on init)

// Interaction state
var isDragging = false;
var dragStartPos = null;
var dragStartOffset = 0;
var isSnapping = false;
var dragAreaInteraction = null; // InteractionComponent for drag bounds

// Audio Components
var selectAudioComp = null;

// ============ INITIALIZATION ============

// Main initialization function
function initialize() {
    debugLog("Initializing...");

    // Set direction flag
    isVertical = (script.direction === "vertical");

    global.touchSystem.touchBlocking = true;
    
    if (script.spawnedCarousel) {
        if (!initializeSpawnedElements()) return;
    } else {
        if (!initializeExistingElements()) return;
    }

    elementCount = elements.length;
    
    if (elementCount < 1) {
        print("ERROR [LinearCarouselController]: No elements to display");
        return;
    }
    
    // Set initial index
    currentIndex = Math.min(script.startingIndex, elementCount - 1);
    carouselOffset = 0;
    targetOffset = 0;
    
    // Position elements initially
    updateElementPositions();

    // Register events
    registerSwipeEvents();
    if (script.enableTapToSelect) {
        registerTapEvents();
    }
    registerUpdateEvent();

    // Notify initial selection
    notifyElementsOfPosition();
    if (script.callbackOnStart) {
        executeCallback(currentIndex);
    }

    // Create Audio Components
    selectAudioComp = createAudioComp(script.selectAudioTrack);

    debugLog("Carousel initialized with " + elementCount + " elements, starting at index " + currentIndex);
}

/**
 * Initialize by spawning elements from template
 * @returns {boolean} Success
 */
function initializeSpawnedElements() {
    if (!script.elementTemplate) {
        debugLog("ERROR: Element template not assigned", true);
        return false;
    }
    
    if (!script.spawnParent) {
        debugLog("ERROR: Spawn parent not assigned", true);
        return false;
    }
    
    if (!script.textures || script.textures.length === 0) {
        debugLog("ERROR: No textures provided for spawned carousel", true);
        return false;
    }
    
    if (!global.spawn) {
        debugLog("ERROR: SpawnManager (global.spawn) not found. Make sure SpawnManager is initialized.", true);
        return false;
    }
    
    debugLog("Spawning " + script.textures.length + " elements...");
    
    for (var i = 0; i < script.textures.length; i++) {
        var spawnResult = global.spawn.create(script.elementTemplate, script.spawnParent, "carousel_elements");
        
        if (!spawnResult || !spawnResult.obj) {
            debugLog("ERROR: Failed to spawn element " + i, true);
            continue;
        }
        
        var obj = spawnResult.obj;
        var st = obj.getComponent("Component.ScreenTransform");
        
        if (!st) {
            debugLog("WARNING: Spawned element " + i + " has no ScreenTransform", true);
        }
        
        // Find CarouselElement script
        var elementScript = findCarouselElementScript(obj);
        
        if (!elementScript) {
            debugLog("WARNING: Spawned element " + i + " has no CarouselElement script", true);
        }
        
        // Pass texture to element
        if (elementScript && elementScript.setTexture) {
            elementScript.setTexture(script.textures[i]);
        } else {
            // Fallback: try to set texture on Image component directly
            var img = obj.getComponent("Component.Image");
            if (img && script.textures[i]) {
                makeMatUnique(img);
                img.mainPass.baseTex = script.textures[i];
            }
        }
        
        // Get or create interaction component
        var interaction = obj.getComponent("Component.InteractionComponent");
        if (!interaction) {
            interaction = obj.createComponent("Component.InteractionComponent");
        }
        
        elements.push({
            obj: obj,
            script: elementScript,
            screenTransform: st,
            interaction: interaction,
            index: i
        });
        
        obj.enabled = true;
    }
    
    return elements.length > 0;
}

/**
 * Initialize using pre-existing elements
 * @returns {boolean} Success
 */
function initializeExistingElements() {
    if (!script.elements || script.elements.length === 0) {
        debugLog("ERROR: No elements provided", true);
        return false;
    }
    
    debugLog("Initializing " + script.elements.length + " existing elements...");
    
    for (var i = 0; i < script.elements.length; i++) {
        var obj = script.elements[i];
        
        if (!obj) {
            debugLog("WARNING: Element " + i + " is null", true);
            continue;
        }
        
        var st = obj.getComponent("Component.ScreenTransform");
        
        if (!st) {
            debugLog("WARNING: Element " + i + " has no ScreenTransform", true);
        }
        
        // Find CarouselElement script
        var elementScript = findCarouselElementScript(obj);
        
        if (!elementScript) {
            debugLog("WARNING: Element " + i + " has no CarouselElement script", true);
        }
        
        // Get or create interaction component
        var interaction = obj.getComponent("Component.InteractionComponent");
        if (!interaction) {
            interaction = obj.createComponent("Component.InteractionComponent");
        }
        
        elements.push({
            obj: obj,
            script: elementScript,
            screenTransform: st,
            interaction: interaction,
            index: i
        });
        
        obj.enabled = true;
    }
    
    return elements.length > 0;
}

/**
 * Find CarouselElement script on object or children
 * @param {SceneObject} obj 
 * @returns {ScriptComponent|null}
 */
function findCarouselElementScript(obj) {
    // Check on the object itself
    var scripts = obj.getComponents("Component.ScriptComponent");
    for (var i = 0; i < scripts.length; i++) {
        if (scripts[i].isCarouselElement) {
            return scripts[i];
        }
    }
    
    // Check immediate children
    for (var c = 0; c < obj.getChildrenCount(); c++) {
        var child = obj.getChild(c);
        var childScripts = child.getComponents("Component.ScriptComponent");
        for (var j = 0; j < childScripts.length; j++) {
            if (childScripts[j].isCarouselElement) {
                return childScripts[j];
            }
        }
    }
    
    return null;
}

// ============ POSITION MANAGEMENT ============

// Update all element positions based on current carousel offset
function updateElementPositions() {
    var halfCount = elementCount / 2;
    var wrapWidth = elementCount * script.spacing;
    var wrapThreshold = (halfCount + script.wrapBuffer) * script.spacing;
    
    for (var i = 0; i < elementCount; i++) {
        var element = elements[i];
        if (!element.screenTransform) continue;
        
        // Calculate base position relative to this element's index
        // Element at currentIndex should be at position 0 when carouselOffset is 0
        var basePosition = (i - currentIndex) * script.spacing;
        
        // Apply carousel offset (from dragging or animation)
        var rawPosition = basePosition + carouselOffset * script.spacing;
        
        // Teleport elements that go beyond edge threshold
        while (rawPosition > wrapThreshold) {
            rawPosition -= wrapWidth;
        }
        while (rawPosition < -wrapThreshold) {
            rawPosition += wrapWidth;
        }
        
        // Set position based on direction
        var currentCenter = element.screenTransform.anchors.getCenter();
        if (isVertical) {
            element.screenTransform.anchors.setCenter(new vec2(currentCenter.x, rawPosition));
        } else {
            element.screenTransform.anchors.setCenter(new vec2(rawPosition, currentCenter.y));
        }
    }
    
    notifyElementsOfPosition();
}


// Notify all elements of their distance from center
function notifyElementsOfPosition() {
    for (var i = 0; i < elementCount; i++) {
        var element = elements[i];
        
        // Get current position on the carousel axis
        var axisPos = 0;
        if (element.screenTransform) {
            var center = element.screenTransform.anchors.getCenter();
            axisPos = isVertical ? center.y : center.x;
        }
        
        // Calculate distances
        var rawDistance = Math.abs(axisPos);
        var normalizedDistance = rawDistance / script.spacing;
        
        // Determine if this element is the current center element
        var isCenter = (rawDistance < script.spacing * 0.5);
        
        // Enable/disable InteractionComponent based on distance
        // This prevents wrapped/off-screen elements from catching taps
        if (element.interaction && script.enableTapToSelect) {
            element.interaction.enabled = (normalizedDistance < script.interactionCutoff);
        }
        
        // Call update method on element script
        if (element.script && element.script.updateDistanceFromCenter) {
            element.script.updateDistanceFromCenter(normalizedDistance, rawDistance, isCenter);
        }
    }
}

// ============ SWIPE/DRAG HANDLING ============

// Register swipe/drag events
function registerSwipeEvents() {
    // If dragArea is provided, use its InteractionComponent for bounded dragging
    if (script.dragArea) {
        dragAreaInteraction = script.dragArea.getComponent("Component.InteractionComponent");
        if (!dragAreaInteraction) {
            dragAreaInteraction = script.dragArea.createComponent("Component.InteractionComponent");
        }
        dragAreaInteraction.isFilteredByDepth = false;
        
        // Bind to InteractionComponent events for bounded dragging
        dragAreaInteraction.onTouchStart.add(onTouchStart);
        dragAreaInteraction.onTouchMove.add(onTouchMove);
        dragAreaInteraction.onTouchEnd.add(onTouchEnd);
        
        debugLog("Swipe events registered to drag area InteractionComponent");
    } else {
        // Fallback to global touch events (drag anywhere)
        var touchStartEvent = script.createEvent("TouchStartEvent");
        touchStartEvent.bind(function(eventData) {
            onTouchStart({ position: eventData.getTouchPosition() });
        });
        
        var touchMoveEvent = script.createEvent("TouchMoveEvent");
        touchMoveEvent.bind(function(eventData) {
            onTouchMove({ position: eventData.getTouchPosition() });
        });
        
        var touchEndEvent = script.createEvent("TouchEndEvent");
        touchEndEvent.bind(function(eventData) {
            onTouchEnd({ position: eventData.getTouchPosition() });
        });
        
        debugLog("Swipe events registered globally (no drag area specified)");
    }
}

// Handle touch start
function onTouchStart(eventArgs) {
    // Interrupt snap animation if in progress
    if (isSnapping) {
        isSnapping = false;
    }
    
    dragStartPos = eventArgs.position;
    dragStartOffset = carouselOffset;
    isDragging = true;
    
    debugLog("Touch started at x=" + dragStartPos.x.toFixed(3));
}

// Handle touch move - move carousel in real-time
function onTouchMove(eventArgs) {
    if (!isDragging || !dragStartPos) return;
    
    var currentPos = eventArgs.position;
    // Use appropriate axis based on direction
    var delta = isVertical 
        ? -(currentPos.y - dragStartPos.y) 
        : (currentPos.x - dragStartPos.x);
    
    // Convert screen delta to carousel offset
    carouselOffset = dragStartOffset + (delta * script.swipeSensitivity);
    
    updateElementPositions();
}

// Handle touch end - snap to nearest element
function onTouchEnd(eventArgs) {
    if (!isDragging) return;
    
    isDragging = false;
    
    // Calculate which element index we should snap to
    var offsetInIndices = carouselOffset;
    var snapIndex = currentIndex - Math.round(offsetInIndices);
    
    // Wrap the index
    snapIndex = ((snapIndex % elementCount) + elementCount) % elementCount;
    
    // Calculate the target offset that would center this element
    var indexDelta = snapIndex - currentIndex;
    
    // Handle wrapping for shortest path
    if (indexDelta > elementCount / 2) {
        indexDelta -= elementCount;
    } else if (indexDelta < -elementCount / 2) {
        indexDelta += elementCount;
    }
    
    // Set new current index and calculate target offset
    var oldIndex = currentIndex;
    currentIndex = snapIndex;
    targetOffset = 0; // Target is always 0 (centered on currentIndex)
    
    // Adjust carouselOffset to be relative to new currentIndex
    carouselOffset = carouselOffset + (currentIndex - oldIndex);
    
    // Handle wrap-around in offset
    while (carouselOffset > elementCount / 2) {
        carouselOffset -= elementCount;
    }
    while (carouselOffset < -elementCount / 2) {
        carouselOffset += elementCount;
    }
    
    // Start snap animation
    isSnapping = true;
    
    // Play sound if changed
    if (oldIndex !== currentIndex) {
        playSelectSound();
        executeCallback(currentIndex);
    }
    
    debugLog("Snapping to index " + currentIndex + " from offset " + carouselOffset.toFixed(3));
}

// ============ TAP HANDLING ============

// Register tap events using InteractionComponent's onTap
function registerTapEvents() {
    for (var i = 0; i < elementCount; i++) {
        (function(index) {
            var element = elements[index];
            if (!element.interaction) return;
            
            // Use InteractionComponent's onTap event
            element.interaction.onTap.add(function(eventArgs) {
                debugLog("Tap event fired for element " + index);
                handleElementTap(index);
            });
        })(i);
    }
    
    debugLog("Tap events registered for " + elementCount + " elements");
}

/**
 * Handle tap on an element
 * @param {number} elementIndex 
 */
function handleElementTap(elementIndex) {
    if (elementIndex === currentIndex && !isSnapping && Math.abs(carouselOffset) < 0.01) {
        // Already centered and stable, could trigger a "confirm" action
        debugLog("Tapped already-centered element " + elementIndex);
        return;
    }
    
    debugLog("Tapped element " + elementIndex + ", moving from " + currentIndex);
    
    // Stop any current drag
    isDragging = false;
    
    // Calculate shortest path delta from current to target
    var delta = elementIndex - currentIndex;
    
    // Handle wrapping for shortest path
    if (delta > elementCount / 2) {
        delta -= elementCount;
    } else if (delta < -elementCount / 2) {
        delta += elementCount;
    }
    
    // Update current index to the tapped element
    currentIndex = elementIndex;
    
    carouselOffset = delta;
    targetOffset = 0;
    
    isSnapping = true;
    playSelectSound();
    executeCallback(currentIndex);
}

// ============ ANIMATION UPDATE ============

// Main update loop
function update(eventData) {
    if (isSnapping && !isDragging) {
        // Animate towards target offset (which is always 0)
        var delta = targetOffset - carouselOffset;
 
        if (Math.abs(delta) < 0.01) {
            // Snap complete
            carouselOffset = targetOffset;
            isSnapping = false;
            debugLog("Snap complete at index " + currentIndex);
        } else {
            // Lerp towards target
            var speed = script.animationSpeed * eventData.getDeltaTime();
            carouselOffset = lerp(carouselOffset, targetOffset, Math.min(speed, 1.0));
        }
        
        updateElementPositions();
    }
}

// Register update event
function registerUpdateEvent() {
    var updateEvent = script.createEvent("UpdateEvent");
    updateEvent.bind(update);
}

// ============ CALLBACKS ============

/**
 * Execute callback when selection changes
 * @param {number} index 
 */
function executeCallback(index) {
    if (!script.enableCallbacks) return;
    
    switch (script.callbackType) {
        case 0: // Global Function
            if (script.onSelectGlobalFunction && global[script.onSelectGlobalFunction]) {
                global[script.onSelectGlobalFunction](index, elements[index]);
            } else {
                debugLog("ERROR: Global function \"" + script.onSelectGlobalFunction + "\" not defined");
            }
            break;
            
        case 1: // Custom Script
            if (script.customScript && script.onSelectFunction && script.customScript[script.onSelectFunction]) {
                script.customScript[script.onSelectFunction](index, elements[index])
            } else {
                debugLog("ERROR: Custom function \"" + script.onSelectFunction + "\" not defined");
            }
            break;
    }
}

// ============ AUDIO ============

function createAudioComp(audioTrack) {
    if (audioTrack) {
        var audioComp = script.getSceneObject().createComponent("Component.AudioComponent");
        audioComp.audioTrack = audioTrack;
        return audioComp;
    }
    return null;
}

function playSelectSound() {
    if (selectAudioComp) {
        selectAudioComp.play(1);
    }
}

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

// ==================== PUBLIC API ====================

/**
 * Get currently selected element index
 * @returns {number}
 */
script.getSelectedIndex = function() {
    return currentIndex;
};

/**
 * Get element at index
 * @param {number} index 
 * @returns {object|null} Element object with { obj, script, screenTransform, index }
 */
script.getElement = function(index) {
    if (index >= 0 && index < elementCount) {
        return elements[index];
    }
    return null;
};

/**
 * Get all elements
 * @returns {Array}
 */
script.getElements = function() {
    return elements;
};

/**
 * Get element count
 * @returns {number}
 */
script.getElementCount = function() {
    return elementCount;
};

/**
 * Programmatically select an element
 * @param {number} index 
 * @param {boolean} [animate=true] Whether to animate to the element
 */
script.selectElement = function(index, animate) {
    if (index < 0 || index >= elementCount) return;
    
    if (animate === false) {
        // Instant jump
        currentIndex = index;
        carouselOffset = 0;
        updateElementPositions();
        executeCallback(currentIndex);
    } else {
        // Animate to element (same as tap)
        handleElementTap(index);
    }
};

/**
 * Move to next element
 */
script.next = function() {
    var nextIndex = (currentIndex + 1) % elementCount;
    script.selectElement(nextIndex, true);
};

/**
 * Move to previous element
 */
script.previous = function() {
    var prevIndex = (currentIndex - 1 + elementCount) % elementCount;
    script.selectElement(prevIndex, true);
};

// ============ DEBUG ============

function debugLog(message, force) {
    if (!force && !script.enableLogging) return;
    var newLog = "[LinearCarousel] " + message;
    if(global.textLogger) global.logToScreen(newLog);
    print(newLog);
}

script.createEvent("OnStartEvent").bind(initialize);