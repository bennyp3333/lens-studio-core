# Classes

Reusable class definitions that provide foundational functionality for managing callbacks, timing, and event handling across your Lens Studio projects.

## Overview

The Classes folder contains core JavaScript classes that can be instantiated and used throughout your project. These classes are designed to handle common programming patterns and provide robust, tested solutions for timing and callback management.

## Available Classes

### [CallbackTracker.js](./CallbackTracker.js)

A flexible callback management system that supports multiple callback types and event-driven architecture.

**Note:** CallbackTracker is primarily used as the underlying system for `GlobalEvents` (see [Managers/](../Managers/)). For most use cases, you should use `global.events` instead of instantiating CallbackTracker directly. However, CallbackTracker is available if you need to create custom callback systems with specific requirements.

**Key Features:**
- Add and remove callbacks dynamically
- Support for custom scripted callbacks
- Integration with Lens Studio's Behavior system
- Custom function invocation across script components
- Event-based callback triggering with custom data

**Basic Usage:**
```javascript
var tracker = new global.CallbackTracker(scriptComponent);

// Add a custom callback
tracker.addCallback("onTap", function(eventData) {
    print("Tapped with data: " + eventData);
});

// Trigger all callbacks for an event
tracker.invokeAllCallbacks("onTap", { x: 100, y: 200 });

// Remove a callback
tracker.removeCallback("onTap", myCallback);
```

**Callback Types:**
- **Type 1 - Behavior**: Triggers Lens Studio Behavior components
- **Type 2 - Global Behavior**: Sends custom triggers to the global behavior system
- **Type 3 - Custom Functions**: Invokes named functions on other script components

**Common Use Cases:**
- Building reusable UI components with configurable callbacks
- Creating event-driven systems
- Bridging between different script components
- Managing multiple callback sources for a single event

**Control Methods:**
- `addCallback(eventName, callback)` - Add a callback to an event
- `removeCallback(eventName, callback)` - Remove a specific callback
- `invokeAllCallbacks(eventName, eventData)` - Trigger all callbacks for an event
- `invokeScriptedCallbacks(eventName, eventData)` - Trigger only custom callbacks
- `invokeCallbacks(eventName, eventData)` - Trigger behavior/function callbacks

---

### [DelayManager.js](./DelayManager.js)

A comprehensive timing and delayed execution system with support for loops, tags, and both time-based and frame-based delays.

**Key Features:**
- Time-based and frame-based delays
- Loop support (finite and infinite)
- Pause, resume, and stop controls
- Tag-based delay management
- Persistent delays that can be reused
- Separate `onLoop` and `onComplete` callbacks
- Pass arguments to callback functions

**Basic Usage:**
```javascript
// Simple delay
var myDelay = new global.Delay({
    onComplete: function() {
        print("Delayed function executed!");
    },
    time: 3
});

// Looping delay
var loopingDelay = new global.Delay({
    onLoop: function(loopIndex, totalLoops) {
        print("Loop " + (loopIndex + 1) + " of " + totalLoops);
    },
    onComplete: function() {
        print("All loops finished!");
    },
    time: 1,
    loops: 5
});
```

**Advanced Features:**
```javascript
// Create a local DelayManager for grouped control
var localDelayManager = new global.DelayManager(script);

var myDelay = localDelayManager.Delay({
    onLoop: function(arg1, arg2) {
        print("Arguments: " + arg1 + ", " + arg2);
    },
    args: ["Hello", 123],
    time: 2,
    loops: 3,
    tags: ["myTag", "important"],
    persistent: true,  // Can be restarted after completion
    frames: 60,        // Use frames instead of time
});

// Control multiple delays by tag
global.pauseDelays("myTag");
global.resumeDelays("myTag");
global.stopDelays("myTag");
```

**Control Methods:**
- `start()` - Start the delay
- `pause()` - Pause the delay
- `resume()` - Resume a paused delay
- `stop()` - Stop and purge the delay
- `triggerNow()` - Execute immediately

**Configuration Methods:**
- `setTime(seconds)` - Set time-based delay
- `setFrames(count)` - Set frame-based delay
- `setLoops(count)` - Set loop count
- `setOnLoop(func)` - Set loop callback
- `setOnComplete(func)` - Set completion callback
- `addTag(tag)` - Add tag for management
- `setPersistent(bool)` - Make delay reusable

**Getters:**
- `isRunning()` - Check if delay is active
- `isPaused()` - Check if delay is paused
- `getTimeLeft()` - Get remaining time
- `getFramesLeft()` - Get remaining frames
- `getCurrentLoop()` - Get current loop index
- `getLoopsLeft()` - Get remaining loops

**Common Use Cases:**
- Timed sequences and animations
- Cooldown systems
- Periodic updates and polling
- Tutorial step timing
- Spawning systems with delays
- Frame-precise timing for animations

---

## Integration Notes

Both classes are automatically made available globally when included in the Core package:
```javascript
global.CallbackTracker  // Available anywhere
global.DelayManager     // Available anywhere
global.Delay           // Shorthand for global DelayManager
```

**Best Practices:**
- Use `global.events` for event-driven communication (see [Managers/](../Managers/))
- Use `global.Delay()` for simple, one-off delays
- Create local `DelayManager` instances for grouped delay control
- Use tags when you need to control multiple related delays
- Set `persistent: true` for delays you plan to restart
- Use frame-based delays for animation-precise timing
- Use time-based delays for user-facing timers
- Always clean up delays when objects are destroyed

## Further Documentation

For detailed implementation examples and full API documentation, see the inline comments in each class file.