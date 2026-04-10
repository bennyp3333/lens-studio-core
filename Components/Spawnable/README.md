# Spawnable

Base scripts for objects that are dynamically spawned at runtime via [SpawnManager](../../Managers/README.md#spawnmanagerjs).

## Overview

The Spawnable folder contains a base script template and example implementations for objects that get instantiated during runtime. These scripts integrate with SpawnManager to provide lifecycle callbacks, self-management methods, and registry tracking.

> **Note:** Using a Spawnable script is optional. SpawnManager can spawn any prefab or SceneObject, but adding a Spawnable script enables additional features like `onSpawned`/`onDespawn` callbacks and `script.despawn()` self-destruction.

## Scripts

### [SpawnableBase.js](./SpawnableBase.js)

A template script to copy and modify for your own spawnable objects. Provides the core spawnable pattern with lifecycle hooks and self-management methods.

**What it provides:**
- `script.isSpawnable` - Marker for SpawnManager to identify the script
- `script.spawnId` - Unique ID assigned on spawn
- `script.spawnGroup` - Group name assigned on spawn
- `script.spawnManager` - Reference to the SpawnManager API
- `script.onSpawned()` - Callback when spawned (override this)
- `script.onDespawn()` - Callback before destruction (override this)
- `script.despawn()` - Self-destruct and remove from registry
- `script.despawnAfter(delay)` - Self-destruct after delay

**Usage:**
1. Copy SpawnableBase.js and rename it for your use case
2. Override `script.onSpawned()` with your initialization logic
3. Override `script.onDespawn()` for cleanup if needed
4. Add your custom properties and methods

### [Popup.js](./Popup.js)

A ready-to-use spawnable that creates animated popups. Fades in, slides in a random direction, fades out, and self-destructs. Supports both screen-space (2D) and world-space (3D) modes via an `is3D` toggle.

**Setup (2D screen-space mode):**
1. Create a Screen Image under an Orthographic Camera
2. Attach Popup.js to the Screen Image
3. Configure textures and animation parameters
4. Disable the SceneObject (this is your template)
5. Spawn copies using SpawnManager

**Setup (3D world-space mode):**
1. Create a Scene Object with an Image component
2. Attach Popup.js and enable the `is 3D` toggle
3. Optionally add a LookAtComponent for billboard behaviour
4. Disable the SceneObject (this is your template)
5. Spawn copies using SpawnManager

**Basic Usage:**
```javascript
//@input SceneObject popupTemplate
//@input SceneObject popupParent

// 2D screen-space (is3D off) — pass a vec2 in -1 to 1 range
var popup = global.spawn.create(script.popupTemplate, script.popupParent, "popups");
popup.script.animate(new vec2(0, 0));

// 3D world-space (is3D on) — pass a vec3 world position
var popup3D = global.spawn.create(script.popupTemplate, script.popupParent, "popups");
popup3D.script.animate(new vec3(0, 10, 0));
```

### Popup Configuration

**Mode:**
- **is 3D** - When off (default), uses ScreenTransform and screen-space coordinates. When on, uses the object's Transform and world-space coordinates, and exposes the `trajectoryZ` range.

**Textures:**
- **textures** - Array of textures to randomly select from on each spawn. Leave empty to use the Image component's default texture. Great for variety (e.g., multiple star sprites, different emoji, hit marker styles).

**Animation Timing:**
- **fadeInTime** - Duration of fade-in (seconds). Default: `0.1`
- **fadeOutTime** - Duration of fade-out (seconds). Default: `0.1`
- **slideTime** - Total slide animation duration (seconds). Default: `0.5`
- **slideDistance** - How far the popup travels (screen units in 2D, world units in 3D). Default: `0.25`

**Trajectory:**
- **trajectoryX** - Horizontal direction range `[min, max]`. Default: `[-1, 1]` (any horizontal direction)
- **trajectoryY** - Vertical direction range `[min, max]`. Default: `[0, 1]` (upward only)
- **trajectoryZ** - Depth direction range `[min, max]`. Default: `[0, 0]` (no Z movement). Only shown when `is 3D` is enabled.

Each spawned popup picks a random direction within the trajectory ranges and normalises it, so you can spawn dozens simultaneously and each will animate independently.

## Creating Your Own Spawnable

Start with SpawnableBase.js as a template:

```javascript
// MySpawnable.js

// === SPAWNABLE IDENTITY (required) ===
script.isSpawnable = true;
script.spawnId = null;
script.spawnGroup = null;
script.spawnManager = null;

var self = script.getSceneObject();

// === LIFECYCLE CALLBACKS ===
script.onSpawned = function() {
    // Your initialization here
    print("Spawned: " + script.spawnId);
};

script.onDespawn = function() {
    // Your cleanup here
};

// === SELF-MANAGEMENT (required for despawn) ===
script.despawn = function() {
    if (script.spawnManager && script.spawnId) {
        script.spawnManager.destroy(script.spawnId);
    } else {
        self.destroy();
    }
};

// === YOUR CUSTOM METHODS ===
script.doSomething = function() {
    // Your logic here
};
```

## Important Notes

**For SceneObject templates (not prefabs):**
- The source SceneObject must be **disabled** in the hierarchy
- SpawnManager automatically enables copies after spawning

**Registry management:**
- Always use `script.despawn()` or `global.spawn.destroy(id)` instead of `obj.destroy()`
- This keeps the SpawnManager registry clean
- Objects destroyed externally won't auto-remove from registry (use `global.spawn.cleanup()` if needed)

## Example Project

The [Example](./Example/) folder contains a working demonstration with:
- Tap to spawn 3D boxes - using both SceneObject templates and Prefabs
- Tap to spawn 2D popups at touch position
- Modified SpawnableBase showing custom initialization

## Related

- [SpawnManager](../../Managers/README.md#spawnmanagerjs) - Full spawning API documentation