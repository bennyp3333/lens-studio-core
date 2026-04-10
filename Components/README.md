# Components

Ready-to-use script components that can be attached to scene objects to add common functionality to your Lens Studio projects.

## Overview

The Components folder contains practical, production-ready scripts that handle frequently needed behaviors in lens development. These components are designed to be dropped onto scene objects and configured through the Inspector panel, requiring minimal to no code modification.

Unlike the core systems (Classes and Managers) which are set up automatically via the Core prefab, these components are used on an as-needed basis throughout your project.

## Component Categories

### [Buttons/](./Buttons/)

Interactive button components for building UI elements:

- **PushButton** - Standard tap buttons with press feedback
- **ToggleButton** - Stateful buttons that switch between selected/deselected states  
- **ButtonArray** - Manages groups of toggle buttons with radio button or multi-select behavior

Perfect for creating interactive menus, settings panels, and UI controls. See the [Buttons README](./Buttons/) for detailed documentation and examples.

### [Fader/](./Fader/)

Flexible fading system with support for multiple animation modes:

- **Fader** - Controller for fade, scale, and slide animations with easing and callbacks
- **FaderManager** - Global singleton for coordinating animations by name or tag

Ideal for UI transitions, menu systems, tooltips, and any visibility animations. See the [Fader README](./Fader/) for detailed documentation and examples.

### [Games/](./Games/)

Utility components for game mechanics and scoring:

- **Timer** - Flexible countdown/countup timer with formatting, text display, and callbacks
- **Score** - Score tracking with formatting, multipliers, and persistent high score storage

Essential for any game or timed experience. See the [Games README](./Games/) for detailed documentation and examples.

### [GPU Particles/](./GPU%20Particles/)

Controller for GPU-based particle systems:

- **GPUParticlesController** - Start, stop, pause, and reset GPU particle effects with programmatic control

Essential for effects that need to be triggered or controlled at runtime. See the [GPU Particles README](./GPU%20Particles/) for implementation details.

### [Spawnable/](./Spawnable/)

Base scripts for objects that are dynamically spawned at runtime:

- **SpawnableBase** - Template script with lifecycle callbacks and self-management methods
- **Popup** - Ready-to-use animated screen popup that fades, slides, and self-destructs

Use with [SpawnManager](../Managers/README.md#spawnmanagerjs) for runtime object instantiation. See the [Spawnable README](./Spawnable/) for detailed documentation and examples.

## General Components

### [BaseScript.js](./BaseScript.js)

A template script that provides the standard structure used throughout Lens Studio Core projects.

**What it includes:**
- Pre-configured `init()` and `onUpdate()` event handlers
- Debug logging integration with TextLogger
- Common variable declarations (self, selfTransform)
- Consistent debug printing function

**Usage:**

Use this as your starting point for new scripts. Copy BaseScript.js when creating a new component to get the standard structure and logging setup automatically configured.

**Key Features:**
- `debugPrint(text)` - Logs to console, screen (via TextLogger), and optional Text component
- Toggle debug mode on/off in the Inspector
- Integrates with Core prefab's TextLogger for on-screen debugging

### [CameraSwitcher.js](./CameraSwitcher.js)

Manages front/back camera switching with automatic object visibility toggling.

**Key Features:**
- Automatically enable/disable objects based on active camera
- Optional callback functions when camera switches
- Global variables `global.isFrontCamera` and `global.isBackCamera`
- Support for both global and custom function callbacks

**Common Use Cases:**
- Different content for front vs back camera
- Triggering effects when camera switches

### [LookAt.js](./LookAt.js)

Makes objects orient themselves toward a target with multiple facing modes.

**Modes:**
- **Look At Point** - Face toward target's position
- **Look At Direction** - Face along target's forward direction
- **Billboard** - Face camera while constrained to an axis

**Key Features:**
- Optional smoothing for rotation
- Configurable up vector and axis constraints
- Rotation offset support
- World or local space operation
- Runtime target switching via API

**Common Use Cases:**
- UI elements that face the camera
- Characters or objects tracking a target
- Billboarded sprites and effects

### [ScreenToWorld.js](./ScreenToWorld.js)

Places an object at a screen position converted to world space.

**Key Features:**
- Normalized screen coordinates (0-1)
- Configurable world depth from camera
- Optional position smoothing
- Auto-finds perspective camera if not assigned
- Runtime position updates via API

**Common Use Cases:**
- Screen-anchored 3D elements
- Touch/tap position indicators
- HUD elements in world space
- Screen-relative object placement

### [SmoothFollow.js](./SmoothFollow.js)

Makes an object smoothly follow another object's position and/or rotation.

**Key Features:**
- Independent position and rotation following
- Adjustable smoothing speeds for each
- Instant snap option for manual updates
- Runtime target switching via API

**Common Use Cases:**
- Smooth camera following
- Floating UI elements
- Object tethering with lag
- Follow-cam behaviors

### [FPScounter.js](./FPScounter.js)

Displays real-time frame rate on screen with smoothing.

**Key Features:**
- Smoothed FPS calculation for stable readings
- Configurable smoothing amount

**Usage:**

Attach to an object with a Text component for instant FPS monitoring during development.

### [EnableObjectsOnStart.js](./EnableObjectsOnStart.js)

Enables assigned Scene Objects and Components when the lens starts.

**Key Features:**
- Array of Scene Objects to enable on start
- Array of Components to enable on start
- Optional delay to defer activation and improve startup performance
- Useful for keeping objects disabled in Scene view to reduce clutter

**Common Use Cases:**
- Cleaning up the Scene hierarchy during development
- Organizing complex scenes
- Deferring heavy objects or components to improve initial load performance

### [MakeMatUnique.js](./MakeMatUnique.js)

Automatically clones all materials on a Scene Object so they become unique instances.

**Key Features:**
- Prevents shared-material side effects when modifying materials at runtime
- Supports RenderMeshVisual, Image, and Text3D components
- Automatically clones and reassigns materials on initialization

**Common Use Cases:**
- Animating or modifying material parameters per object
- Avoiding global changes to materials shared across multiple visuals

### [ScreenWiggle.js](./ScreenWiggle.js)

Applies a sinusoidal bobbing and rotation animation to one or more UI elements' ScreenTransforms.

**Key Features:**
- Independent horizontal and vertical bobbing with configurable speed and amount
- Aspect-ratio correction so equal bob amounts produce equal visual displacement regardless of screen orientation
- Optional tilt rotation animation
- Per-target randomization so each element moves independently (not in tandem)
- Multi-target support — assign an array of ScreenTransforms to drive many elements from a single update loop
- Falls back to the ScreenTransform on the same SceneObject when no targets are assigned
- `start()` / `stop()` / `reset()` / `randomize()` public API for runtime control

**Common Use Cases:**
- Idle animation on UI icons or decorative elements
- Floating/bobbing effects on HUD elements
- Performance-efficient wiggle across many UI elements using a single script instance

## Integration with Core Systems

All components are designed to work seamlessly with the Core prefab systems:

- **Debug Logging**: Most components support `global.textLogger` for on-screen debug output
- **Global Events**: Components can trigger and listen to global events via `global.events`
- **Delay Manager**: Components can use `global.Delay()` for timed behaviors

## Best Practices

- Start with BaseScript.js as a template for custom components
- Enable debug logging during development, disable for production
- Use the Inspector to configure components rather than editing code
- Check component headers for version info and local API documentation
- Many components expose public functions for programmatic control

## Examples

Individual component folders contain example projects demonstrating real-world usage. Check the Buttons and GPU Particles folders for interactive examples.