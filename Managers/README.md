# Managers

Global management systems that provide core functionality across your entire Lens Studio project. These scripts are automatically set up by the Core prefab and provide essential services for events, utilities, and debugging.

## Overview

The Managers folder contains three critical systems that are instantiated by the Core prefab and made globally accessible throughout your project. Unlike components that you attach to individual objects, these managers are singleton systems that you access via the `global` namespace.

## Manager Systems

### [GlobalEvents.js](./GlobalEvents.js)

A global event system for decoupled communication between scripts throughout your project.

**Access via:**
```javascript
global.events
```

**Key Features:**
- Simple string-based event naming
- Pass custom data with events
- Add/remove listeners dynamically
- No direct script references needed
- Built on CallbackTracker for reliability

**Basic Usage:**
```javascript
// Add a listener
global.events.add("gameStarted", function(data) {
    print("Game started with difficulty: " + data.difficulty);
});

// Trigger an event
global.events.trigger("gameStarted", { difficulty: "hard" });

// Remove a listener
global.events.remove("gameStarted", myCallbackFunction);
```

**Common Use Cases:**
- UI button triggers affecting gameplay
- Game state changes notifying multiple systems
- Achievement/milestone notifications
- Cross-scene communication
- Decoupling dependencies between scripts

**Best Practices:**
- Use descriptive event names (e.g., "gameStarted", "scoreChanged")
- Document your event names in a central location
- Pass meaningful data objects with events
- Remove listeners when objects are destroyed to prevent memory leaks

### [GlobalUtils.js](./GlobalUtils.js)

Consolidates all utility functions from the Utilities folder into a single global object for easy access.

**Access via:**
```javascript
global.utils
```

**What it does:**
- Automatically imports all utility modules
- Merges utility functions into `global.utils`
- Detects naming conflicts between utilities
- Can load additional utilities from scripts on the same object

**Available Utilities:**

Once GlobalUtils loads, all utility functions become accessible:
```javascript
global.utils.lerp()           // Math utilities
global.utils.clamp()
global.utils.randomRange()    // Random utilities
global.utils.randomChoice()
global.utils.cloneArray()     // Array utilities
global.utils.shuffleArray()
global.utils.findByName()     // Scene utilities
global.utils.findByPath()
global.utils.rgbToHex()       // Color utilities
global.utils.hexToRgb()
// ... and many more
```

**How it works:**

GlobalUtils uses `require()` to import each utility module from the Utilities folder and merges their exported functions into a single `global.utils` object. This means you don't need to import utilities individually - they're all available globally after Core initializes.

**Conflict Detection:**

If multiple utilities export functions with the same name, GlobalUtils will print a warning to the console. This helps catch naming conflicts during development.

### [TextLogger.js](./TextLogger.js)

An on-screen debug logging system for displaying runtime information directly in the camera view.

**Access via:**
```javascript
global.textLogger    // Full API
global.logToScreen() // Quick logging
global.logError()    // Error logging
```

**Key Features:**
- Display text logs on screen during testing
- Scrolling log with configurable limit
- Color-coded error messages
- Top-to-bottom or bottom-to-top display
- Optional unique render layer
- Enable/disable at runtime

**Basic Usage:**
```javascript
// Simple logging
global.logToScreen("Hello World!");

// Log with variables
global.logToScreen("Score: " + score);

// Error logging (displays in red)
global.logError("Something went wrong!");

// Clear the log
global.textLogger.clear();
```

**Configuration:**
```javascript
// Change log limit
global.textLogger.setLogLimit(30);

// Change text color
global.textLogger.setTextColor(new vec4(1, 1, 0, 1));

// Toggle logging
global.textLogger.setLoggingEnabled(false);

// Clear error state
global.textLogger.clearError();
```

**Common Use Cases:**
- Debugging without connecting to desktop
- Displaying runtime values on device
- Tracking game state during testing
- Monitoring performance metrics
- Quick prototyping feedback

**Inspector Options:**
- **Logging Enabled** - Toggle logging on/off
- **Log Limit** - Maximum number of messages to display
- **Log Top to Bottom** - Display newest messages at top or bottom
- **Text Component** - The Text component to write to
- **Use Unique Layer** - Render logs on separate layer (useful for effects that affect screen)

**Integration:**

Most Core components automatically use TextLogger when debug logging is enabled. Look for `printDebug()` functions that call `global.logToScreen()`.

### [SpawnManager.js](./SpawnManager.js)

A global system for spawning and managing instantiated objects from prefabs or scene object templates.

**Access via:**
```javascript
global.spawn
```

**Key Features:**
- Spawn from ObjectPrefabs or disabled SceneObject templates
- Automatic ID assignment for each spawned object
- Group spawned objects for batch operations
- Query spawned objects by ID or group
- Batch destroy by group or all at once
- Integrates with [Spawnable scripts](../Components/Spawnable/README.md) for lifecycle callbacks

**Basic Usage:**
```javascript
// Spawn an object
var entry = global.spawn.create(source, parent, "enemies");

// Access the spawned object
entry.id;      // Unique spawn ID
entry.obj;     // The SceneObject
entry.script;  // The Spawnable script (if present)

// Destroy by ID
global.spawn.destroy(entry.id);

// Destroy all in a group
global.spawn.destroyGroup("enemies");
```

**Spawning from Different Sources:**
```javascript
// From a prefab asset
//@input Asset.ObjectPrefab enemyPrefab
var enemy = global.spawn.create(script.enemyPrefab, script.spawnParent, "enemies");

// From a disabled SceneObject template
//@input SceneObject popupTemplate {"hint":"Should be DISABLED in hierarchy"}
var popup = global.spawn.create(script.popupTemplate, script.spawnParent, "popups");
```

**Query Functions:**
```javascript
// Get by ID
var entry = global.spawn.get(spawnId);

// Get all in a group
var enemies = global.spawn.getGroup("enemies");
for (var i = 0; i < enemies.length; i++) {
    print(enemies[i].obj.name);
}

// Get all spawned objects
var all = global.spawn.getAll();

// Count objects
var enemyCount = global.spawn.count("enemies");
var totalCount = global.spawn.count();
```

**Destroy Functions:**
```javascript
// Destroy single object
global.spawn.destroy(spawnId);

// Destroy all in group
global.spawn.destroyGroup("enemies");

// Destroy everything
global.spawn.destroyAll();

// Clean up registry (removes references to externally destroyed objects)
global.spawn.cleanup();
```

**Working with Spawnable Scripts:**

SpawnManager works best with scripts that implement the [Spawnable pattern](../Components/Spawnable/README.md). When a spawned object has a Spawnable script, SpawnManager automatically:
- Assigns `spawnId`, `spawnGroup`, and `spawnManager` references
- Calls `onSpawned()` after instantiation
- Calls `onDespawn()` before destruction

```javascript
// Spawn and call methods on the spawnable script
var popup = global.spawn.create(script.popupRef, script.parent, "popups");
if (popup.script) {
    popup.script.animate(screenPos);
}

// The spawnable can destroy itself
// Inside the spawnable script:
script.despawn(); // Removes from registry and destroys
```

**Important Notes for SceneObject Templates:**
- The source SceneObject should be **DISABLED** in the hierarchy
- SpawnManager automatically enables copies after spawning
- Scripts on copied objects are only accessible after enabling
- A warning is logged (in debug mode) if the source is enabled

**Common Use Cases:**
- Projectile/bullet spawning
- Particle-like effects (popups, hit markers)
- Enemy wave spawning
- Any dynamic object instantiation

**Best Practices:**
- Use meaningful group names ("enemies", "bullets", "popups")
- Always use `global.spawn.destroy()` or `script.despawn()` instead of `obj.destroy()` to keep the registry clean
- Call `global.spawn.cleanup()` periodically if objects may be destroyed externally

## How Managers Initialize

The Core prefab sets up these managers in the following order:

1. **CallbackTracker** (from Classes) - Loaded first as a dependency
2. **GlobalEvents** - Uses CallbackTracker for event management
3. **DelayManager** - Provides timing utilities
4. **GlobalUtils** - Consolidates all utility functions
5. **SpawnManager** - Provides spawn management
6. **TextLogger** - Provides debug output

This initialization order ensures dependencies are available when needed.

> **Important:** For performance reasons, GlobalEvents, DelayManager, SpawnManager, GlobalUtils, and TextLogger scripts are **disabled by default** in the Core prefab's scene hierarchy. You must enable the specific manager scripts you need for your project before they become available. This prevents unnecessary overhead from unused managers.

## Integration Between Managers

The manager systems work together seamlessly:

**Events + Utils:**
```javascript
global.events.add("updateScore", function(data) {
    var clamped = global.utils.clamp(data.score, 0, 100);
    global.logToScreen("Score: " + clamped);
});
```

**Events + TextLogger:**
```javascript
global.events.add("debug", function(message) {
    global.logToScreen(message);
});

global.events.trigger("debug", "Player entered zone");
```

**Utils + TextLogger:**
```javascript
var randomValue = global.utils.randomRange(1, 100);
global.logToScreen("Random: " + randomValue);
```

**DelayManager + Events:**
```javascript
new global.Delay({
    onComplete: function() {
        global.events.trigger("timerComplete");
    },
    time: 5
});
```

**SpawnManager + Events:**
```javascript
// Notify when enemies are cleared
global.events.add("clearEnemies", function() {
    var destroyed = global.spawn.destroyGroup("enemies");
    global.logToScreen("Cleared " + destroyed + " enemies");
});

global.events.trigger("clearEnemies");
```

**SpawnManager + DelayManager:**
```javascript
// Spawn enemies in waves
function spawnWave(count) {
    for (var i = 0; i < count; i++) {
        new global.Delay({
            time: i * 0.5,
            onComplete: function() {
                global.spawn.create(script.enemyPrefab, script.parent, "enemies");
            }
        });
    }
}
```

## Best Practices

- **Use Global Events** for cross-script communication instead of direct references
- **Access Utils via global.utils** rather than importing individual modules
- **Enable TextLogger during development**, disable for production
- **Remove event listeners** when objects are destroyed
- **Use consistent event naming** across your project
- **Log to screen liberally** during development for easier debugging

## Global Namespace

After Core initializes, the following are available globally:
```javascript
global.events          // Event system
global.utils           // All utility functions
global.spawn           // Spawn management system
global.textLogger      // Logger object
global.logToScreen()   // Quick log function
global.logError()      // Quick error log function
global.Delay()         // Delay creation (from DelayManager)
global.DelayManager    // DelayManager class
global.CallbackTracker // CallbackTracker class
```