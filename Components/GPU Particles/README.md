# GPU Particles

Controller component for managing GPU-based particle systems in Lens Studio with programmatic start, stop, and timing control.

## Overview

The GPU Particles folder contains a single component that provides runtime control over GPU particle effects. GPU particles in Lens Studio are highly efficient but typically start automatically and run continuously. This controller gives you the ability to trigger, stop, and reset particle effects on demand.

## Component

### GPUParticlesController.js

A controller that handles lifecycle management for GPU particle systems.

**Basic Setup:**
1. Create a Scene Object with a RenderMeshVisual component
2. Assign a GPU particles material to the mesh
3. Attach GPUParticlesController script to the object
4. Configure start behavior and particle settings

**Key Features:**
- Start particles immediately or with delay
- Auto-stop after specified duration
- Reset particles for fresh playback
- Toggle particles on/off
- Unique seed generation for varied effects
- Override particle count at runtime
- Debug logging integration

## Usage

### Inspector Configuration

**Start on Init** - Automatically start particles when lens loads

**Use Unique Seeds** - Generate random seed each time particles start (creates variation)

**Override Particle Count** - Change the number of particles from material settings

### Programmatic Control

The controller exposes a simple API for runtime control:
```javascript
var particles = script.getSceneObject().getComponent("Component.ScriptComponent");

particles.start();        // Start immediately
particles.stop();         // Stop particles
particles.reset();        // Reset to beginning
particles.toggle();       // Toggle on/off
```

**Delayed Start:**
```javascript
// Start after 2 seconds
particles.start(2);
```

**Auto-Stop:**
```javascript
// Start after 1 second, auto-stop after 3 seconds
particles.start(1, 3);
```

**Manual Control:**
```javascript
particles.stop();         // Stop playback
particles.reset();        // Reset to start (stops and resets time)
particles.toggle();       // Start if stopped, stop if running
```

**State Checking:**
```javascript
if (particles.isRunning()) {
    print("Particles are playing");
}
```

## Common Use Cases

### Trigger on Tap

Start particles when user taps:
```javascript
script.createEvent("TapEvent").bind(function() {
    particles.reset();
    particles.start();
});
```

### Timed Effect

Play particles for a specific duration:
```javascript
// Play particles for exactly 2 seconds
particles.start(0, 2);
```

### Repeating Effect

Use with DelayManager for looping effects:
```javascript
var particleLoop = new global.Delay({
    onLoop: function() {
        particles.reset();
        particles.start();
    },
    time: 5,
    loops: -1  // Infinite
});
```

### Toggle Effect

Allow user to turn particles on/off:
```javascript
script.createEvent("TapEvent").bind(function() {
    particles.toggle();
});
```

## How It Works

GPU particles in Lens Studio use external time input to control playback. The controller:

1. Clones the material to make it unique (prevents affecting other instances)
2. Controls the mesh visual visibility
3. Manages the external time input via UpdateEvent
4. Handles unique seed generation for variation
5. Coordinates delayed start/stop timing

This approach gives you full control while maintaining GPU particle performance.

## Integration with Core

- **Debug Logging** - Outputs to TextLogger when enabled
- **Delay Manager** - Can be used with `global.Delay()` for complex timing
- **Global Events** - Can trigger particles via `global.events`

## Best Practices

- **Unique Seeds** - Keep enabled for effects that should look different each time
- **Start on Init** - Disable if you want manual control of when particles begin
- **Override Particle Count** - Use to adjust density without modifying materials
- **Reset Before Restart** - Call `reset()` for clean repeat playbacks
- **Material Setup** - Ensure your material is properly configured for GPU particles

## Example Project

Check the "Example Project" folder for a working demonstration showing:
- Basic particle triggering
- Delayed start and auto-stop
- Toggle behavior
- Multiple particle systems