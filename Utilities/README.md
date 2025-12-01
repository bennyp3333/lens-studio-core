# Utilities

A collection of utility functions organized by domain, providing commonly needed operations for math, arrays, colors, strings, scene objects, and more.

## Overview

The Utilities folder contains modular utility libraries that are automatically consolidated and made globally accessible via `global.utils` by the GlobalUtils manager. Each utility file focuses on a specific domain and exports a set of related functions.

All utility functions are available immediately after the Core prefab initializes - no imports or setup required.

## Utility Modules

### [BaseTools.js](./BaseTools.js)

Injects common utility functions directly onto a script reference for convenient access. Lightweight alternative to DelayManager for quick one-off operations.

> **Note:** Unlike other utilities, BaseTools is accessed via `global.BaseTools(script)` and injects functions directly onto the **script** reference rather than being called through `global.utils`.

**Key Functions:**
- `delay(delayTime, callback)` - Execute callback after delay, returns event
- `delayTween(delayTime, object, tweenName)` - Start a tween after delay
- `delayAudio(delayTime, action, audio, loops)` - Play/stop audio after delay
- `delayEnable(delayTime, object, state)` - Enable/disable object after delay
- `createAudioComp(audioTrack)` - Create AudioComponent on this SceneObject

**Usage Example:**
```javascript
//@input Asset.AudioTrackAsset beepAudioTrack

global.BaseTools(script);

var beepAudioComp = script.createAudioComp(script.beepAudioTrack);

script.delay(1.0, function() {
    print("1 second later!");
    beepAudioComp.play(1);
});

script.delayTween(1.5, tweenObj, "fadeIn");

script.delayEnable(2.0, someObject, false);

script.delayAudio(3.0, "play", beepAudioComp, 1);
```

### [MathUtils.js](./MathUtils.js)

Mathematical operations and transformations.

**Key Functions:**
- `lerp(a, b, t)` - Linear interpolation between two values
- `clamp(val, min, max)` - Constrain value within range
- `remap(val, inMin, inMax, outMin, outMax)` - Remap value from one range to another
- `approxEqual(v1, v2, epsilon)` - Check if values are approximately equal
- `degreesToRadians(degrees)` - Convert degrees to radians
- `radiansToDegrees(radians)` - Convert radians to degrees

**Usage Example:**
```javascript
// Interpolate between values
var halfway = global.utils.lerp(0, 100, 0.5); // 50

// Clamp values
var clamped = global.utils.clamp(150, 0, 100); // 100

// Remap from one range to another
var remapped = global.utils.remap(5, 0, 10, 0, 100); // 50
```

### [ArrayUtils.js](./ArrayUtils.js)

Array manipulation and utilities.

**Key Functions:**
- `cloneArray(array)` - Create shallow copy of array
- `removeFromArray(array, element)` - Remove first occurrence of element
- `shuffleArray(array)` - Randomly shuffle array in place
- `arrayIncludes(array, thing)` - Check if array contains element
- `arrayRemoveDuplicates(array)` - Remove duplicate values
- `indexOfMax(array)` - Get index of maximum value
- `forEach(array, fn)` - Iterate over array elements

**Usage Example:**
```javascript
// Shuffle array
var items = [1, 2, 3, 4, 5];
global.utils.shuffleArray(items);

// Remove element
global.utils.removeFromArray(items, 3);

// Get max value
var max = global.utils.getMax([5, 2, 8, 1]); // 8
```

### [ColorUtils.js](./ColorUtils.js)

Color space conversions and color generation.

**Key Functions:**
- `rgbToHsv(color)` - Convert RGB to HSV color space
- `hsvToRgb(color)` - Convert HSV to RGB color space
- `colorRandom(alpha)` - Generate random RGBA color
- `randomColorHue(brightness, saturation, alpha)` - Random color with specified HSV values

**Usage Example:**
```javascript
// Convert RGB to HSV
var hsv = global.utils.rgbToHsv(new vec3(1, 0, 0));

// Generate random color with specific brightness
var color = global.utils.randomColorHue(0.8, 1.0, 1.0);
```

### [StringUtils.js](./StringUtils.js)

String manipulation and analysis.

**Key Functions:**
- `stringSimilarity(s1, s2)` - Calculate similarity between strings (0.0 to 1.0)
- `randomId(len)` - Generate random alphanumeric string
- `chunkText(txt, len)` - Split text into chunks intelligently

### [RandomUtils.js](./RandomUtils.js)

Random number and selection utilities.

**Key Functions:**
- `randomRange(lo, hi)` - Random number in range
- `arrayRandom(arr)` - Select random element from array
- `objectRandom(obj)` - Select random element from object

### [ObjectUtils.js](./ObjectUtils.js)

Object manipulation utilities.

**Key Functions:**
- `setDefault(obj, key, def)` - Set default value if key doesn't exist

### [SceneUtils.js](./SceneUtils.js)

Scene object search and manipulation functions.

**Key Functions:**
- `findFirstSceneObjectByName(root, name)` - Find first object by name
- `searchSceneObjectsByName(root, name)` - Find all objects by name
- `findFirstComponentByType(root, type)` - Find first component of type
- `searchComponentsByType(root, type)` - Find all components of type
- `findFirstByPredicate(object, predicate)` - Find object matching condition
- `searchByPredicate(object, predicate)` - Find all objects matching condition
- `isDescendantOf(sceneObject, root)` - Check parent-child relationship
- `applyToDescendants(rootObject, toApply)` - Apply function to all descendants
- `findScript(sceneObj, propName, filterFunc)` - Find script component on object
- `findScriptUpwards(sceneObj, propName, filterFunc, allowSelf)` - Find script in parent hierarchy
- `recursiveAlpha(rootObj, alpha, effectDisabled)` - Set alpha on all visual components in hierarchy

**Usage Example:**
```javascript
// Find object by name
var player = global.utils.findFirstSceneObjectByName(null, "Player");

// Find all cameras
var cameras = global.utils.searchComponentsByType(null, "Component.Camera");

// Find using custom condition
var bigObjects = global.utils.searchByPredicate(null, function(obj) {
    return obj.getTransform().getLocalScale().x > 10;
});
```

### [ComponentUtils.js](./ComponentUtils.js)

Component-specific utilities for common operations.

**Frequently Used Functions:**

**`setAlpha(meshVis, alpha)` / `setAlphaObject(obj, alpha)`**

Sets the alpha/transparency on any visual component (RenderMeshVisual, Image, Text3D, or Text).

**`makeMatUnique(meshVis)` / `makeMatUniqueObject(obj)`**

Clones materials to make them unique, preventing changes from affecting other objects sharing the same material.

**Other Functions:**
- `getAlphaObject(obj)` / `getAlpha(meshVis)` - Get current alpha value
- `setAlpha(meshVis, alpha)` - Set alpha on mesh visual
- `makeMatArrayUnique(meshVisArray)` - Make materials unique across multiple visuals

**Usage Example:**
```javascript
// Fade out an object
global.utils.setAlphaObject(myObject, 0.5);

// Make material unique before modifying
var meshVis = myObject.getComponent("Component.RenderMeshVisual");
global.utils.makeMatUnique(meshVis);
meshVis.mainPass.baseColor = new vec4(1, 0, 0, 1);

// Set alpha recursively on all children
global.utils.recursiveAlpha(parentObject, 0.5, false);
```

### [Easing.js](./Easing.js)

Easing functions for smooth animations and transitions. Accessed via `global.easing` as well as `global.utils`.

**Available Easing Functions:**

**Linear:** `linear(t)` - No easing

**Sine:** `easeInSine(t)`, `easeOutSine(t)`, `easeInOutSine(t)` - Gentle easing

**Quadratic:** `easeInQuad(t)`, `easeOutQuad(t)`, `easeInOutQuad(t)` - Moderate acceleration

**Cubic:** `easeInCubic(t)`, `easeOutCubic(t)`, `easeInOutCubic(t)` - Strong acceleration

**Quartic:** `easeInQuart(t)`, `easeOutQuart(t)`, `easeInOutQuart(t)` - Very strong acceleration

**Quintic:** `easeInQuint(t)`, `easeOutQuint(t)`, `easeInOutQuint(t)` - Extreme acceleration

**Exponential:** `easeInExpo(t)`, `easeOutExpo(t)`, `easeInOutExpo(t)` - Exponential curves

**Circular:** `easeInCirc(t)`, `easeOutCirc(t)`, `easeInOutCirc(t)` - Circular motion curves

**Back:** `easeInBack(t)`, `easeOutBack(t)`, `easeInOutBack(t)` - Overshoot and return

**Elastic:** `easeInElastic(t)`, `easeOutElastic(t)`, `easeInOutElastic(t)` - Spring-like motion

**Bounce:** `easeInBounce(t)`, `easeOutBounce(t)`, `easeInOutBounce(t)` - Bouncing motion

All easing functions take a normalized time value `t` (0.0 to 1.0) and return the eased value.

### [SimpleTween.js](./SimpleTween.js)

A lightweight tweening system for animating values over time. Accessed via `global.simpleTween` as well as `global.utils.simpleTween`.

**Function:**

**simpleTween(startVal, endVal, time, delay, updateCallback, doneCallback)**

Creates a simple linear tween between two values.

**Parameters:**
- `startVal` - Starting value
- `endVal` - Ending value  
- `time` - Duration in seconds
- `delay` - Delay before starting in seconds
- `updateCallback(val)` - Called each frame with current value
- `doneCallback(val)` - Called when complete with final value

**Returns:** UpdateEvent that the tween is bound to

**Usage Example with Easing:**
```javascript
// Simple position tween with easing
var startPos = 0;
var endPos = 100;

var startVal = 0;
var endVal = 1;

var tweenTime = 2;
var tweenDelay = 0;

global.simpleTween(startVal, endVal, tweenTime, tweenDelay, 
    function(val) {
        // On Update
        print("Tween update! Value: " + val);

        // Apply easing to the value
        var easedVal = global.easing.easeOutBounce(val);
        var lerpedVal = global.utils.lerp(startPos, endPos, easedVal);
        myObject.getTransform().setLocalPosition(new vec3(easedVal, 0, 0));
    },
    function(val) {
        // On Complete
        print("Tween complete! Value: " + val);
    }
);
```

## Best Practices

- **Use global.utils** - All utilities are pre-loaded and ready to use
- **Check function signatures** - Look at the source files for parameter details
- **Combine utilities** - Mix and match utilities for complex operations
- **Material cloning** - Always use `makeMatUnique` before modifying shared materials
- **Scene searches** - Pass `null` as root to search entire scene

## Adding Custom Utilities

To add your own utilities that integrate with the system:

1. Create a new utility file in the Utilities folder
2. Export functions at the bottom of the file
3. Add reference to your new script in GlobalUtils

```javascript
// At the end of your custom utility file:
var exports = {
    myFunction1,
    myFunction2
};

if(script){
    script.exports = exports;
    if(!global.utils){ global.utils = {}; }
    Object.assign(global.utils, exports);
}else{
    module.exports = exports;
}

// In GlobalUtils.js
var utilModules = [
    ...
    tryRequire("../Utilities/YourUtils.js")
]
```

## Module System

Each utility file supports both script and module usage:

- **As Script:** Functions auto-load into `global.utils`
- **As Module:** Can be imported with `require()`

This dual approach allows utilities to work in both the Core system and standalone projects.