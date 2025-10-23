# Managers

Global management systems that provide core functionality across your entire Lens Studio project. These scripts are automatically set up by the Core prefab and provide essential services for events, utilities, and debugging.

## Overview

The Managers folder contains three critical systems that are instantiated by the Core prefab and made globally accessible throughout your project. Unlike components that you attach to individual objects, these managers are singleton systems that you access via the `global` namespace.

## Manager Systems

### GlobalEvents.js

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

### GlobalUtils.js

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

### TextLogger.js

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

## How Managers Initialize

The Core prefab sets up these managers in the following order:

1. **CallbackTracker** (from Classes) - Loaded first as a dependency
2. **GlobalEvents** - Uses CallbackTracker for event management
3. **DelayManager** - Provides timing utilities
4. **GlobalUtils** - Consolidates all utility functions
5. **TextLogger** - Provides debug output

This initialization order ensures dependencies are available when needed.

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
global.textLogger      // Logger object
global.logToScreen()   // Quick log function
global.logError()      // Quick error log function
global.Delay()         // Delay creation (from DelayManager)
global.DelayManager    // DelayManager class
global.CallbackTracker // CallbackTracker class
```