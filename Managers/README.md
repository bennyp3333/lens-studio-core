# Managers

Global management systems that provide core functionality across your entire Lens Studio project. These scripts are automatically set up by the Core prefab and provide essential services for events, utilities, and debugging.

## Overview

The Managers folder contains three critical systems that are instantiated by the Core prefab and made globally accessible throughout your project. Unlike components that you attach to individual objects, these managers are singleton systems that you access via the `global` namespace.

## Manager Systems

### [TouchBlocking.js](./TouchBlocking.js)

Inspector-driven wrapper for `global.touchSystem` touch blocking. Enables blocking of all native Snapchat gestures and exposes per-type exception toggles (Swipe, Tap, DoubleTap, Scale, Pan, Touch, None).

### [AudioManager.js](./AudioManager.js)

A global audio manager for playing named audio tracks from any script in your project.

**Access via:**
```javascript
global.audioManager
```

**Key Features:**
- Reference audio tracks by name from anywhere in your project
- Per-track AudioComponent pooling — each track starts with one dedicated component
- `allowConcurrent` grows the pool on demand so multiple overlapping plays are supported
- `allowOverwrite` controls whether a new play call interrupts an in-progress sound
- Options object on all public methods for per-call setting overrides and callbacks
- `onStart` / `onComplete` callbacks on `play()` without modifying inspector config
- Delay support on all operations via `options.delay`
- Pending delayed plays are cancelled immediately when `stop()` or `pause()` is called, even when those calls themselves use `options.delay`
- `isPlaying()` query method for conditional logic
- Duplicate track name detection at startup

**Basic Usage:**
```javascript
// Play a sound
global.audioManager.play("bubblePop");

// Play with onComplete shorthand
global.audioManager.play("countdown", function(comp) {
    print("countdown finished!");
});

// Play with full options
global.audioManager.play("music", {
    delay:      2.0,
    loop:       true,
    volume:     0.5,
    fadeInTime: 1.0,
    onStart:    function(comp) { print("music started"); },
    onComplete: function(comp) { print("music stopped"); }
});

// Stop a sound (cancels any pending delayed plays, respects track fadeOut)
global.audioManager.stop("music");

// Stop with a custom fade for just this call
global.audioManager.stop("music", { fadeOutTime: 0.5 });

// Stop after a delay
global.audioManager.stop("music", { delay: 3.0 });

// Check if a track is currently playing
if (!global.audioManager.isPlaying("music")) {
    global.audioManager.play("music", { loop: true });
}
```

**Playing Multiple Tracks:**
```javascript
// Play several tracks at once
global.audioManager.play(["ambience", "music"]);

// onComplete fires once — only on the first track
global.audioManager.play(["ambience", "music"], {
    onComplete: function() { print("ambience finished"); }
});

// Stop several at once
global.audioManager.stop(["ambience", "music"]);
```

**Per-Call Setting Overrides:**
```javascript
// Override track settings for a single call — track config is not changed
global.audioManager.play("sfx", {
    volume:          0.3,
    allowConcurrent: false,
    allowOverwrite:  true
});
```

**Adding Tracks at Runtime:**
```javascript
// Tracks can also be registered from script at runtime
global.audioManager.addTracks({
    trackName:       "powerUp",
    track:           script.powerUpAsset,
    volume:          0.8,
    loop:            false,
    fadeIn:          false,
    fadeOut:         true,
    fadeOutTime:     0.3,
    allowOverwrite:  true,
    allowConcurrent: false
});

// Remove a track and destroy its AudioComponents
global.audioManager.removeTracks("powerUp");
```

**State Query:**
```javascript
// Check if a track is currently playing (any AudioComponent in its pool)
global.audioManager.isPlaying("music"); // returns bool
```

**Inspector Options (per track):**
- **Name** — Unique string key used to reference this track
- **track** — The AudioTrackAsset to play
- **volume** — Volume multiplier (0–1), default 1.0
- **loop** — Loop indefinitely, default false
- **fadeIn / fadeInTime** — Fade in on play
- **fadeOut / fadeOutTime** — Fade out on stop
- **allowConcurrent** — Pool multiple AudioComponents for overlapping plays
- **allowOverwrite** — Stop and restart if already playing (only visible when allowConcurrent is off)

**allowOverwrite / allowConcurrent:**

| allowConcurrent | allowOverwrite | Behaviour |
|---|---|---|
| `true` | — | Find a free AudioComponent or create a new one; supports simultaneous plays |
| `false` | `false` | Skip if already playing |
| `false` | `true` | Stop current and restart |

A paused AudioComponent is always treated as available — it will be stopped and replayed regardless of `allowOverwrite`.

**Common Use Cases:**
- UI sound effects (button taps, transitions)
- Looping background music with clean stop/fade
- Overlapping SFX (bubble pops, footsteps) via `allowConcurrent`
- Timed audio cues synced to animations via `options.delay`
- Chaining sounds using `onComplete` to trigger the next play

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
- Imports utility modules (configurable per-module via Advanced Options)
- Merges utility functions into `global.utils`
- Detects naming conflicts between utilities
- Can load additional utilities from scripts on the same object

**Advanced Options:**

Enable the **Advanced Options** toggle in the inspector to reveal individual per-module toggles. Each of the 10 utility modules can be disabled to skip loading it at startup — useful for reducing overhead in projects that only use a subset of utilities. All modules are enabled by default.

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
- Async prefab instantiation via `createAsync` with progress and completion callbacks
- Automatic ID assignment for each spawned object
- Group spawned objects for batch operations
- Query spawned objects by ID or group
- Batch destroy by group or all at once
- Integrates with [Spawnable scripts](../Components/Spawnable/README.md) for lifecycle callbacks

**Basic Usage:**
```javascript
// Spawn an object synchronously
var entry = global.spawn.create(source, parent, "enemies");

// Access the spawned object
entry.id;        // Unique spawn ID string
entry.obj;       // The SceneObject
entry.transform; // Transform component (entry.obj.getTransform())
entry.group;     // Group name, or null
entry.script;    // The Spawnable script component, or null

// Destroy by ID
global.spawn.destroy(entry.id);

// Destroy all in a group
global.spawn.destroyGroup("enemies");
```

**Spawning from Different Sources:**
```javascript
// From a prefab asset (synchronous)
//@input Asset.ObjectPrefab enemyPrefab
var enemy = global.spawn.create(script.enemyPrefab, script.spawnParent, "enemies");

// From a disabled SceneObject template
//@input SceneObject popupTemplate {"hint":"Should be DISABLED in hierarchy"}
var popup = global.spawn.create(script.popupTemplate, script.spawnParent, "popups");
```

**Async Spawning:**
```javascript
// Spawn a prefab asynchronously — useful for large assets
global.spawn.createAsync(
    script.enemyPrefab,
    script.spawnParent,
    function(entry) {
        if (!entry) { print("Spawn failed"); return; }
        print("Spawned: " + entry.obj.name);
    },
    "enemies"               // optional group
);

// With an optional progress callback
global.spawn.createAsync(
    script.largePrefab,
    script.spawnParent,
    function(entry) { print("Done"); },
    "assets",
    function(progress) { print("Loading: " + (progress * 100) + "%"); }
);
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

---

## How Managers Initialize

The Core prefab sets up these managers in the following order:

1. **TouchBlocking** - Configures native touch blocking
2. **AudioManager** - Registers audio tracks and exposes global playback API
3. **CallbackTracker** (from Classes) - Loaded first as a dependency
4. **GlobalEvents** - Uses CallbackTracker for event management
5. **DelayManager** - Provides timing utilities
6. **GlobalUtils** - Consolidates all utility functions
7. **SpawnManager** - Provides spawn management
8. **TextLogger** - Provides debug output

This initialization order ensures dependencies are available when needed.

> **Important:** For performance reasons, TouchBlocking, AudioManager, GlobalEvents, DelayManager, SpawnManager, GlobalUtils, and TextLogger scripts are **disabled by default** in the Core prefab's scene hierarchy. You must enable the specific manager scripts you need for your project before they become available. This prevents unnecessary overhead from unused managers.

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
global.audioManager    // Audio track management
global.spawn           // Spawn management system
global.textLogger      // Logger object
global.logToScreen()   // Quick log function
global.logError()      // Quick error log function
global.Delay()         // Delay creation (from DelayManager)
global.DelayManager    // DelayManager class
global.CallbackTracker // CallbackTracker class
```