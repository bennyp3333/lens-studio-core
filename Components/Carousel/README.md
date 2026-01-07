# Carousel

Drag-to-scroll carousel system with snap-to-element behavior for Lens Studio. Supports horizontal and vertical orientations with customizable visual effects per element.

## Overview

The Carousel system provides an intuitive scrolling interface for presenting collections of items. Users can swipe to scroll through elements, with smooth snap-to-center animations ensuring a selected element is always prominently displayed.

The system uses a two-component architecture:

- **LinearCarousel** - Controller that manages positioning, interaction, and navigation
- **CarouselElement** - Individual element script that handles visual styling based on distance from center

This separation allows each element to control its own appearance (scale, opacity, rotation) while the carousel handles the mechanics of scrolling and snapping.

## Components

### [LinearCarousel.js](./LinearCarousel.js)

The main controller that manages element positioning, drag interaction, and snap animations.

**Basic Setup:**
1. Attach LinearCarousel script to a controller SceneObject
2. Choose between spawned or existing elements
3. Configure spacing, direction, and animation settings
4. Assign a drag area for bounded interaction (optional)

**Key Features:**
- Horizontal or vertical scrolling
- Infinite wrapping with seamless element teleportation
- Drag-to-scroll with configurable sensitivity
- Smooth snap-to-center animations
- Tap-to-select individual elements
- Spawned or pre-existing element modes
- Selection change callbacks
- Audio feedback on selection

### [CarouselElement.js](./CarouselElement.js)

Individual element controller that receives distance information from the carousel and applies visual effects.

**Basic Setup:**
1. Attach CarouselElement script to each carousel item (or its template)
2. Configure visual behaviors (scale, opacity, rotation)
3. The parent carousel automatically calls the update method each frame

**Key Features:**
- Distance-based scaling (larger when centered)
- Distance-based opacity (fade edges)
- Distance-based rotation (3D perspective effect)
- Dynamic render order (centered elements on top)
- Custom visual callbacks for advanced effects
- Works with spawned or pre-existing elements

## Element Modes

### Spawned Elements

Dynamically create elements from a template and texture array:

```javascript
// In Inspector:
// - Enable "Spawned Carousel"
// - Assign Element Template (disabled SceneObject with CarouselElement script)
// - Assign Spawn Parent
// - Add textures to the Textures array
```

Requires SpawnManager (`global.spawn`) to be initialized. Each texture in the array creates one carousel element.

### Existing Elements

Use pre-configured SceneObjects already in the scene:

```javascript
// In Inspector:
// - Disable "Spawned Carousel"
// - Add SceneObjects to the Elements array
```

Each element should have a CarouselElement script attached for visual control.

## Interaction

### Drag/Swipe

The carousel responds to drag gestures for scrolling:

| Property | Description | Default |
|----------|-------------|---------|
| **Drag Area** | SceneObject defining drag bounds (optional) | None |
| **Swipe Sensitivity** | Movement multiplier for drag input | 2.0 |

If no drag area is assigned, drag input is captured globally.

### Tap to Select

Tap individual elements to bring them to center:

| Property | Description | Default |
|----------|-------------|---------|
| **Enable Tap to Select** | Allow tapping elements | true |
| **Interaction Cutoff** | Disable tap beyond this distance | 2.5 |

The cutoff prevents tapping wrapped/off-screen elements that may have teleported.

## Visual Effects

CarouselElement provides distance-based effects that respond to how far each element is from the center:

### Scale Effect

Elements scale down as they move away from center:

| Property | Description | Default |
|----------|-------------|---------|
| **Center Scale** | Scale when fully centered | 1.0 |
| **Edge Scale** | Scale at falloff distance | 0.7 |
| **Scale Distance** | Distance (in spacing units) for full falloff | 2.0 |
| **Ease Scale** | Apply easing curve to transition | true |

### Opacity Effect

Elements fade as they move away from center:

| Property | Description | Default |
|----------|-------------|---------|
| **Center Opacity** | Opacity when centered | 1.0 |
| **Edge Opacity** | Opacity at falloff distance | 0.5 |
| **Opacity Distance** | Distance for full falloff | 2.0 |
| **Ease Opacity** | Apply easing curve to transition | true |

### Rotation Effect

Elements rotate to create a 3D perspective:

| Property | Description | Default |
|----------|-------------|---------|
| **Max Rotation** | Maximum rotation in degrees | 30.0 |
| **Rotation Distance** | Distance for full rotation | 1.0 |

Elements to the left rotate one direction, elements to the right rotate the opposite.

### Render Order

Dynamically adjust render order so centered elements appear on top:

| Property | Description | Default |
|----------|-------------|---------|
| **Base Render Order** | Minimum render order | 0 |
| **Render Order Range** | How many layers above base for center | 10 |

## Usage

### Selection Callbacks

Configure callbacks in the Inspector or handle programmatically:

**Global Function:**
```javascript
// In global scope
global.onCarouselSelect = function(index, element) {
    print("Selected item " + index);
    updatePreview(element.obj);
};
```

**Custom Script:**
```javascript
// On your handler script
script.handleSelection = function(index, element) {
    print("Selected: " + index);
};
```

### Basic Carousel

```javascript
//@input Component.ScriptComponent carousel

// Navigate programmatically
script.carousel.next();
script.carousel.previous();

// Jump to specific element
script.carousel.selectElement(2, true);  // Animated
script.carousel.selectElement(0, false); // Instant

// Get current selection
var index = script.carousel.getSelectedIndex();
var element = script.carousel.getElement(index);
```

### Custom Visual Effects

Extend CarouselElement with custom behaviors:

```javascript
// Custom script attached to element
script.onDistanceUpdate = function(normalized, raw, isCenter, sceneObject) {
    // Add glow when centered
    if (isCenter) {
        activateGlow();
    } else {
        deactivateGlow();
    }
    
    // Scale particles based on distance
    var particleScale = 1.0 - (normalized * 0.5);
    setParticleScale(particleScale);
};
```

Enable "Custom Visuals" in CarouselElement and assign your script.


## LinearCarousel API

```javascript
// Navigation
script.next()                          // Move to next element
script.previous()                      // Move to previous element
script.selectElement(index, animate?)  // Navigate to specific element

// State
script.getSelectedIndex()              // Get current index
script.getElement(index)               // Get element object at index
script.getElements()                   // Get all element objects
script.getElementCount()               // Get total element count
```

**Element Object Structure:**
```javascript
{
    obj: SceneObject,              // The element's SceneObject
    script: ScriptComponent,       // CarouselElement script (if found)
    screenTransform: ScreenTransform,
    interaction: InteractionComponent,
    index: number
}
```

## CarouselElement API

```javascript
// Called by parent carousel each frame
script.updateDistanceFromCenter(normalized, raw, isCenter)

// Texture handling (for spawned carousels)
script.setTexture(texture)

// State queries
script.getNormalizedDistance()         // 0 = center, 1+ = away
script.getRawDistance()                // Actual screen distance
script.isCurrentlyCenter()             // Is this the centered element?

// Manual overrides
script.setScale(factor)                // Set scale directly
script.setOpacity(alpha)               // Set opacity directly
script.getBaseScale()                  // Get original scale vec2
```

## Common Patterns

### Product Showcase

```javascript
//@input Component.ScriptComponent carousel
//@input Component.Text nameText
//@input Component.Text priceText

global.onProductSelect = function(index, element) {
    var product = productData[index];
    script.nameText.text = product.name;
    script.priceText.text = product.price;
};
```

### Category Navigation

```javascript
//@input Component.ScriptComponent carousel

global.onCategorySelect = function(index, element) {
    loadCategoryContent(index);
};

// External navigation buttons
function onNextPressed() {
    script.carousel.next();
}

function onPrevPressed() {
    script.carousel.previous();
}
```

### Gallery with Preview

```javascript
//@input Component.ScriptComponent carousel
//@input Component.Image previewImage

global.onImageSelect = function(index, element) {
    // Get texture from the selected element
    var img = element.obj.getComponent("Component.Image");
    if (img) {
        script.previewImage.mainPass.baseTex = img.mainPass.baseTex;
    }
};
```

## Integration with Core

The Carousel system integrates with Core components:

- **SpawnManager** - Required for spawned element mode (`global.spawn`)
- **TextLogger** - Debug output when enabled
- **Easing** - Optional easing functions for smooth visual transitions (`global.easing`)

## Best Practices

- **Use Spawned Mode for Dynamic Content** - When textures come from an array or API
- **Use Existing Mode for Complex Elements** - When elements have unique behaviors or child objects
- **Set Interaction Cutoff** - Prevents tapping wrapped elements that appear on screen edges
- **Enable Easing** - Smoother visual transitions, requires `global.easing`
- **Configure Drag Area** - Bounds dragging to a specific region, useful when other UI needs touch input

## Example Project

Check the [Example](./Example/) folder for working demonstrations showing:
- Basic horizontal carousel setup
- Vertical carousel configuration
- Spawned carousel setup
- Callback implementations