# Games

Utility components for game mechanics including timers and score tracking in Lens Studio.

## Overview

The Games folder contains components commonly needed for game-style lenses. These scripts handle timing, scoring, and persistent data storage, allowing you to focus on gameplay rather than boilerplate.

Both components follow the same patterns: configure via Inspector for quick setup, or use the chainable API for programmatic control. They support automatic text display updates and integrate with the Core prefab's debug logging.

## Components

### [Timer.js](./Timer.js)

A flexible timer supporting countdown and countup modes with customizable display formatting.

**Basic Setup:**
1. Attach Timer script to a SceneObject
2. Configure time, format, and direction in the Inspector
3. Optionally assign Text/Text3D components for auto-updating display
4. Reference the script and call `start()` when ready

**Key Features:**
- Countdown or countup modes
- Flexible time formatting with tokens (hours, minutes, seconds, milliseconds)
- Configurable tick interval for sub-second precision
- Pause, resume, and stop controls
- Callbacks for each tick and on completion
- Auto-updates assigned Text components

### [Score.js](./Score.js)

Score tracking with formatting options, multiplier support, and persistent high score storage.

**Basic Setup:**
1. Attach Score script to a SceneObject
2. Configure formatting (prefix, suffix, padding) in the Inspector
3. Optionally assign Text components for score and high score display
4. Enable high score tracking if needed
5. Call `increment()`, `decrement()`, or `setScore()` during gameplay

**Key Features:**
- Increment/decrement with optional amounts
- Score multiplier for combo systems
- Min/max score clamping
- Customizable display formatting (prefix, suffix, zero-padding)
- Persistent high score via Lens Studio storage
- Separate text components for current score and high score
- Callbacks for score changes and new high scores

## Usage

### Timer Examples

**Simple Countdown:**
```javascript
//@input Component.ScriptComponent timer

// Start a 30-second countdown
script.timer.start(function(time, formatted) {
    print("Time's up!");
    endGame();
});
```

**Configured via Inspector:**
Set `maxTime`, `format`, and `countdown` in the Inspector, then just call:
```javascript
script.timer.start();
```

**Stopwatch with Milliseconds:**
```javascript
//@input Component.ScriptComponent timer

script.timer
    .setMaxTime(999)
    .setCountdown(false)
    .setTickInterval(0.1)
    .setFormat("m:ss.S")
    .start();
```

**With Tick Callback:**
```javascript
script.timer
    .setOnTick(function(time, formatted) {
        if (time <= 5) {
            // Flash warning when low on time
            flashTimerRed();
        }
    })
    .setOnComplete(function() {
        gameOver();
    })
    .start();
```

**Pause/Resume:**
```javascript
function onPausePressed() {
    script.timer.pause();
}

function onResumePressed() {
    script.timer.resume();
}
```

### Score Examples

**Basic Scoring:**
```javascript
//@input Component.ScriptComponent score

// Score a point
script.score.increment();

// Score multiple points
script.score.increment(10);

// Lose points
script.score.decrement(5);

// Get current score
var currentScore = script.score.getScore();
```

**Configured via Inspector:**
Set `prefix`, `suffix`, `padding`, and text components in the Inspector for automatic display like "Score: 0042 pts".

**With High Score:**
```javascript
//@input Component.ScriptComponent score
//@input Component.Text scoreText
//@input Component.Text highScoreText

script.score
    .addTextComp(script.scoreText)
    .enableHighScore("myGame_best")
    .addHighScoreTextComp(script.highScoreText)
    .setOnNewHighScore(function(score, formatted) {
        print("New record: " + formatted);
        playFanfare();
    });
```

**Combo Multiplier:**
```javascript
function onComboIncrease(comboCount) {
    script.score.setMultiplier(comboCount);
}

function onComboBroken() {
    script.score.resetMultiplier();
}

function onEnemyDefeated(points) {
    // Points are multiplied by current multiplier
    script.score.increment(points);
}
```

**Game Reset:**
```javascript
function restartGame() {
    script.score.reset();
    script.timer.stop();
    script.timer.start();
}
```

## Inspector Configuration

### Timer Settings

| Property | Description | Default |
|----------|-------------|---------|
| **textComponent** | Text component to auto-update | None |
| **text3DComponent** | Text3D component to auto-update | None |
| **maxTime** | Target time in seconds | 10 |
| **tickInterval** | Seconds between ticks | 1 |
| **countdown** | Count down (true) or up (false) | true |
| **format** | Display format string | "ss" |

### Score Settings

| Property | Description | Default |
|----------|-------------|---------|
| **textComponent** | Text component for current score | None |
| **text3DComponent** | Text3D component for current score | None |
| **prefix** | Text before score value | "" |
| **suffix** | Text after score value | "" |
| **padding** | Zero-pad to this many digits | 0 |
| **minScore** | Minimum allowed score | 0 |
| **useMaxScore** | Enable maximum score limit | false |
| **maxScore** | Maximum allowed score | 100 |
| **multiplier** | Score multiplier for increment | 1.0 |
| **enableHighScoreTracking** | Enable persistent high scores | false |
| **highScoreStorageKey** | Persistent storage key | "highScore" |
| **highScoreTextComponent** | Text component for high score | None |
| **highScoreText3DComponent** | Text3D for high score | None |

## Format Tokens (Timer)

| Token | Description | Example |
|-------|-------------|---------|
| `h` | Hours (no padding) | "1" |
| `hh` | Hours (2-digit) | "01" |
| `m` | Minutes (no padding) | "5" |
| `mm` | Minutes (2-digit) | "05" |
| `s` | Seconds (no padding) | "9" |
| `ss` | Seconds (2-digit) | "09" |
| `S` | Tenths | "3" |
| `SS` | Hundredths | "35" |
| `SSS` | Milliseconds | "350" |

**Format Examples:**
- `"mm:ss"` → "01:30"
- `":ss"` → ":09"
- `"m:ss"` → "1:30"
- `"s"` → "90" (total seconds when no h/m tokens)
- `"ss.S"` → "05.3"
- `"h:mm:ss"` → "1:02:30"

## Timer API

```javascript
// Configuration (chainable)
script.setMaxTime(seconds)        // Set target time
script.setStartTime(seconds)      // Set custom start time
script.setTickInterval(seconds)   // Set tick frequency
script.setCountdown(bool)         // true = countdown, false = countup
script.setFormat(string)          // Set display format
script.addTextComp(comp|array)    // Add text component(s)
script.clearTextComps()           // Remove all text components
script.setOnTick(callback)        // Called each tick: (time, formatted)
script.setOnComplete(callback)    // Called on completion: (time, formatted)

// Control
script.start(onComplete?)         // Start timer
script.pause()                    // Pause timer
script.resume()                   // Resume from pause
script.stop()                     // Stop and reset

// State
script.getTime()                  // Get current time in seconds
script.getFormattedTime()         // Get formatted time string
script.isRunning()                // Check if timer is active
```

## Score API

```javascript
// Configuration (chainable)
script.setPrefix(string)          // Set display prefix
script.setSuffix(string)          // Set display suffix
script.setPadding(digits)         // Set zero-padding
script.setMinScore(value)         // Set minimum score
script.setMaxScore(value)         // Set maximum score (null = unlimited)
script.setMultiplier(value)       // Set score multiplier
script.addTextComp(comp|array)    // Add score text component(s)
script.clearTextComps()           // Remove score text components
script.addHighScoreTextComp(comp|array)  // Add high score text component(s)
script.clearHighScoreTextComps()  // Remove high score text components
script.setOnChange(callback)      // Called on change: (score, formatted)
script.setOnNewHighScore(callback) // Called on new record: (score, formatted)

// High Score
script.enableHighScore(key?)      // Enable tracking (default key: "highScore")
script.disableHighScore()         // Disable tracking
script.getHighScore()             // Get high score value
script.getFormattedHighScore()    // Get formatted high score
script.resetHighScore()           // Reset high score to 0
script.isNewHighScore()           // Check if current > high score

// Score Control
script.setScore(value)            // Set score directly
script.increment(amount?)         // Add to score (default: 1, uses multiplier)
script.decrement(amount?)         // Subtract from score (default: 1)
script.reset()                    // Reset to 0 (or minScore)

// State
script.getScore()                 // Get current score
script.getFormattedScore()        // Get formatted score string
script.getMultiplier()            // Get current multiplier
script.resetMultiplier()          // Reset multiplier to 1
```

## Common Patterns

### Timed Game Round

```javascript
//@input Component.ScriptComponent timer
//@input Component.ScriptComponent score

function startRound() {
    script.score.reset();
    script.timer.start(function() {
        endRound();
    });
}

function endRound() {
    var finalScore = script.score.getScore();
    showResults(finalScore);
}
```

### Survival Timer

```javascript
// Count up to track how long player survives
script.timer
    .setCountdown(false)
    .setMaxTime(9999)
    .setFormat("m:ss")
    .start();

function onPlayerDeath() {
    script.timer.pause();
    var survivalTime = script.timer.getFormattedTime();
    showGameOver(survivalTime);
}
```

## Best Practices

- **Configure in Inspector** - Set defaults in Inspector, override programmatically only when needed
- **Use Callbacks** - React to timer completion and score changes via callbacks
- **Unique Storage Keys** - Use descriptive keys for high scores if you have multiple score types
- **Reset on Restart** - Call `reset()` and `stop()` when restarting games
- **Debug During Development** - Enable debug logging to trace timer ticks and score changes