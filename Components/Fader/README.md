# Fader

Flexible fading system with support for fade, scale, slide and move animations in Lens Studio. Provides centralized management of visibility animations with easing, delays, callbacks, and batch operations.

## Overview

The Fader system provides a unified approach to animating visibility changes on SceneObjects. Rather than adding multiple tweens for fading in and out alpha values, scale transforms, or screen positions, Fader handles all the complexity while exposing a simple API.

The system consists of three main components:

- **Fader** - Individual controller attached to each animated object
- **FaderManager** - Global singleton that coordinates all faders by name or tag
- **Animation** - Internal class handling interpolation and timing

## Component

### [Fader.js](./Fader.js)

A controller that handles visibility animations with multiple modes and extensive customization.

**Basic Setup:**
1. Attach Fader script to any SceneObject you want to animate
2. Choose initial state (Visible or Hidden)
3. Configure In and Out animation modes (fade, scale, slide, or move)
4. Optionally set a custom name or tags for batch operations

**Key Features:**
- Four animation modes: fade, scale, slide, and move
- Independent in/out animation settings
- 11 easing functions with In/Out/InOut types
- Delay and duration control
- Animation queuing and cancellation
- Recursive alpha for child objects
- Tag-based batch operations
- Auto-show and auto-hide options
- Disable objects when hidden
- Material cloning for independent animations

## Animation Modes

### Fade Mode

Animates the alpha/opacity of materials and text components. Supports a configurable material parameter (defaults to `baseColor`) and optional recursive application to all children.

### Scale Mode

Animates the scale transform. Works with both ScreenTransform (for UI elements) and regular Transform components. Can use local or world scale.

### Slide Mode

Animates ScreenTransform anchor positions, creating slide-in/slide-out effects. Useful for UI panels and overlays.

### Move Mode

Animates the position of objects, supporting both 2D (ScreenTransform) and 3D (Transform) components. By default, positions are applied as offsets from the object's starting position, making it easy to create relative motion effects. Can use local or world coordinates for 3D transforms.

## Usage

### Basic Operations

Control faders through the global FaderManager:

```javascript
// Show by name (defaults to SceneObject name)
global.faderManager.show("myPanel");

// Hide with custom timing
global.faderManager.hide("myPanel", {time: 0.5});

// Toggle visibility
global.faderManager.toggle("myButton");
```

### Identifiers

The FaderManager accepts multiple identifier types:

```javascript
// By fader name (string)
global.faderManager.show("myPanel");

// By tag (string) - affects all faders with that tag
global.faderManager.show("uiElements");

// By SceneObject reference
global.faderManager.show(mySceneObject);

// By array (mix of any types)
global.faderManager.show(["panel1", mySceneObj, "menuTag"]);
```

### Animation Options

Customize animations with the options object:

```javascript
global.faderManager.show("myPanel", {
    time: 0.5,      // Duration in seconds
    delay: 0.2,     // Delay before starting
    mode: "scale",  // Override default mode
    cancel: "all"   // How to handle existing animations
});
```

**Cancel Modes:**

- `"all"` - Cancel all animations including delayed ones (default)
- `"active"` - Only cancel animations that have started
- `"none"` - Allow queuing multiple animations

### Callbacks

Multiple ways to handle completion:

```javascript
// Third parameter callback
global.faderManager.show("myPanel", {time: 0.5}, function() {
    print("Animation complete!");
});

// Shorthand (options as callback)
global.faderManager.show("myPanel", function() {
    print("Animation complete!");
});

// Options object callbacks
global.faderManager.show("myPanel", {
    delay: 1,
    onStart: function() {
        print("Animation started after delay!");
    },
    onComplete: function() {
        print("Animation finished!");
    }
});
```

### Queuing Animations

Create sequences by using `cancel: "none"`:

```javascript
// Show immediately, then hide after 3 seconds
global.faderManager.show("tooltip", {delay: 0});
global.faderManager.hide("tooltip", {delay: 3, cancel: "none"});
```

### Instant Changes

Set values without animation:

```javascript
global.faderManager.setAlpha("myPanel", 0.5);

// Or on the fader directly
myFader.setAlpha(1);
myFader.setScale(new vec3(2, 2, 2));
myFader.setRect(new vec4(-1, 1, -1, 1));
myFader.setPosition(new vec2(-0.5, 0));
```

## Inspector Configuration

### Initial State

- **Visible** - Object starts fully shown
- **Hidden** - Object starts in hidden state

### Auto Show/Hide

- **Auto Show** - Automatically show after specified delay
- **Auto Hide** - Automatically hide after specified delay
- Can be combined for timed visibility (e.g., splash screens)

### Animation Settings

- **Mode** - Choose fade, scale, slide, or move
- **Time** - Animation duration in seconds
- **Advanced** - Expand for additional options:
  - **Value/Scale/Rect/Position** - Target value for the animation
  - **Easing Func** - Easing function (Linear, Quadratic, Cubic, etc.)
  - **Easing Type** - In, Out, or InOut
  - **Recursive** - Apply to children (fade mode only)
  - **Parameter** - Material parameter to animate (fade mode only)
  - **Local** - Use local vs world scale/position (scale or position mode)

### Optional Settings

- **Scene Object** - Target a different object than the script's parent
- **Fader Name** - Custom name for FaderManager lookups
- **Fader Tags** - Tags for batch operations
- **Disable When Hidden** - Disable the SceneObject when fully hidden
- **Make Materials Unique** - Clone materials to prevent affecting other instances
- **Apply Move As Offset** - When enabled (default), move positions are relative to the object's starting position rather than absolute

## Common Patterns

### Menu System

```javascript
// Show main menu, hide game UI
global.faderManager.show("mainMenu");
global.faderManager.hide("gameUI");

// On play button press
function onPlayPressed() {
    global.faderManager.hide("mainMenu", {time: 0.3}, function() {
        global.faderManager.show("gameUI");
        startGame();
    });
}
```

### Tooltip with Auto-Hide

```javascript
function showTooltip(text) {
    updateTooltipText(text);
    global.faderManager.show("tooltip", {delay: 0, cancel: "all"});
    global.faderManager.hide("tooltip", {delay: 3, cancel: "none"});
}
```

### Staggered Animation

```javascript
// Animate multiple items with staggered delays
var items = ["item1", "item2", "item3", "item4"];
for (var i = 0; i < items.length; i++) {
    global.faderManager.show(items[i], {delay: i * 0.1});
}
```

### Loading Screen

```javascript
// Configure in Inspector:
// - Initial State: Visible
// - Auto Hide: true
// - Auto Hide Delay: 2.0

// Or programmatically after content loads:
function onContentReady() {
    global.faderManager.hide("loadingScreen", {time: 1}, function() {
        global.faderManager.show("mainContent");
    });
}
```

### Toggle Panel

```javascript
script.createEvent("TapEvent").bind(function() {
    global.faderManager.toggle("settingsPanel");
});
```

### Batch Operations with Tags

Set up multiple faders with the same tag, then control them together:

```javascript
// All faders tagged "hud" will animate together
global.faderManager.hide("hud", {time: 0.5});

// Later...
global.faderManager.show("hud");
```

## Easing Functions

The system supports 11 easing functions, each with three types (In, Out, InOut):

- **Linear** - Constant speed
- **Quadratic** - Gentle acceleration/deceleration
- **Cubic** - Moderate acceleration/deceleration
- **Quartic** - Strong acceleration/deceleration
- **Quintic** - Very strong acceleration/deceleration
- **Sinusoidal** - Smooth sine-based easing
- **Exponential** - Dramatic acceleration/deceleration
- **Circular** - Circular motion feel
- **Back** - Overshoots then settles
- **Elastic** - Spring-like bounce
- **Bounce** - Bouncing effect

**Note:** Requires `global.easing` utility to be loaded. The script will warn if easing functions are unavailable.

## Fader API

Individual fader instances provide direct control:

```javascript
// Get fader reference (if needed)
var fader = script.getSceneObject().getComponent("Component.ScriptComponent");

// Methods
fader.show(animOptions, onComplete);    // Show with animation
fader.hide(animOptions, onComplete);    // Hide with animation
fader.toggle(animOptions, onComplete);  // Toggle visibility
fader.stop();                           // Stop all animations
fader.setAlpha(alpha);                  // Set alpha instantly
fader.setScale(scale, local);           // Set scale instantly
fader.setRect(rect);                    // Set anchors instantly
fader.setPositon(position);             // Set position instantly
fader.refreshCache();                   // Refresh component cache

// State checking
fader.isVisible();                      // Check if currently visible
fader.isAnimating();                    // Check if animation is running
```

## FaderManager API

The global manager provides batch operations:

```javascript
// Animation methods
global.faderManager.show(identifier, animOptions, onComplete);
global.faderManager.hide(identifier, animOptions, onComplete);
global.faderManager.toggle(identifier, animOptions, onComplete);
global.faderManager.stop(identifier);

// Instant methods
global.faderManager.setAlpha(identifier, alpha);

// Management
global.faderManager.add(fader);         // Add fader (automatic on init)
global.faderManager.remove(fader);      // Remove fader
```

## Best Practices

- **Use Tags for Groups** - Tag related UI elements for batch operations
- **Disable When Hidden** - Enable for buttons that you dont want to be tappable while hidden
- **Make Materials Unique** - Keep enabled unless intentionally sharing materials
- **Queue vs Cancel** - Use `cancel: "none"` for sequences, default for responsive UI
- **Recursive Fade** - Enable for containers with multiple visual children
- **Name Your Faders** - Use descriptive names for easier debugging and management
- **Reset Component Cache** - Call `refreshCache()` if adding/removing components at runtime

## Troubleshooting

**Animation not playing:**
- Check that the target object has visual components (Image, RenderMeshVisual, Text)
- Verify the fader name matches what you're calling
- Enable debug logging to trace execution

**Easing not working:**
- Ensure `global.easing` utility script is loaded before Fader initializes
- Check console for warning messages about missing easing functions

**Material changes affecting other objects:**
- Enable "Make Materials Unique" in Optional settings
- This clones materials so each fader has independent control

**Object not re-enabling:**
- If using "Disable When Hidden" on the script's own object, the script can't re-enable itself
- Target a child object instead, or disable "Disable When Hidden"

**GPU Particles Support:**
- For GPU particle systems, set the material parameter to `particles` in the Advanced settings. This will animate all particle alpha parameters (alphaStart, alphaEnd, alphaMinStart, alphaMinEnd, alphaMaxStart, alphaMaxEnd) together.

## Example Project

Check the [Example](./Example/) folder for working demonstrations showing:
- Basic show/hide operations
- Elements with differing in and out animation modes
- Tag-based batch operations
- Callback operations
- Fading GPU particles