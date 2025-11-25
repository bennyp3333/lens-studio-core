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

### [GPU Particles/](./GPU%20Particles/)

Controller for GPU-based particle systems:

- **GPUParticlesController** - Start, stop, pause, and reset GPU particle effects with programmatic control

Essential for effects that need to be triggered or controlled at runtime. See the [GPU Particles README](./GPU%20Particles/) for implementation details.

## General Components

### [BaseScript.js](./BaseScript.js)

A template script that provides the standard structure used throughout Lens Studio Core projects.

**What it includes:**
- Pre-configured `init()` and `onUpdate()` event handlers
- Debug logging integration with TextLogger
- Common variable declarations (self, selfTransform)
- Consistent debug/error printing functions

**Usage:**

Use this as your starting point for new scripts. Copy BaseScript.js when creating a new component to get the standard structure and logging setup automatically configured.

**Key Features:**
- `debugPrint(text)` - Logs to console, screen (via TextLogger), and optional Text component
- `errorPrint(text)` - Logs errors with "!!ERROR!!" prefix for easy identification
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
- Can be triggered on update, on start, or manually

**Common Use Cases:**
- UI elements that face the camera
- Characters or objects tracking a target
- Billboarded sprites and effects

### [SmoothFollow.js](./SmoothFollow.js)

Makes an object smoothly follow another object's position and/or rotation.

**Key Features:**
- Independent position and rotation smoothing
- Adjustable smoothing speeds
- Can be started, stopped, and reset programmatically
- Update attachment target at runtime

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

Enables assigned objects when the lens starts.

**Key Features:**
- Simple array of objects to enable
- Useful for keeping objects disabled in Scene view to reduce clutter
- Objects automatically activate at runtime

**Common Use Cases:**
- Cleaning up the Scene hierarchy during development
- Organizing complex scenes

### [MakeMatUnique.js](./MakeMatUnique.js)

Automatically clones all materials on a Scene Object so they become unique instances.

**Key Features:**
- Prevents shared-material side effects when modifying materials at runtime
- Supports RenderMeshVisual, Image, and Text3D components
- Automatically clones and reassigns materials on initialization

**Common Use Cases:**
- Animating or modifying material parameters per object
- Avoiding global changes to materials shared across multiple visuals

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