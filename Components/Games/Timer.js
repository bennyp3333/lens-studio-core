/*
Timer.js
Version: 1.1.2
Description: Generalized timer utility for Lens Studio
Author: Bennyp3333 [https://benjamin-p.dev]

 ==== Usage ====
 Add this script to a SceneObject.
 Optionally add Text/Text3D components via the inspector.
 Reference this script from another script and call timer.start().

 ==== Examples ====
 
 // Basic 10 second countdown with completion callback
 script.timer.setMaxTime(10)
     .setFormat(":ss")
     .addTextComp(script.timerText)
     .setOnComplete(function(time, formatted) {
         print("Timer Done!");
     })
     .start();

 // Callback can also be passed directly to start()
 script.timer.setMaxTime(30)
     .setFormat("m:ss")
     .start(function(time, formatted) {
         print("Finished at " + formatted);
     });

 // Count up with sub-second precision
 script.timer.setMaxTime(60)
     .setCountdown(false)
     .setTickInterval(0.1)
     .setFormat("s.S")
     .start();

 ==== API ====
 - setMaxTime(seconds)        - Set target time in seconds
 - setStartTime(seconds)      - Set custom start time (optional)
 - setTickInterval(seconds)   - Set tick frequency (default: 1, supports decimals)
 - setCountdown(bool)         - true = countdown (default), false = count up
 - setFormat(string)          - Set display format (see tokens below)
 - setWholeSecondsMode(bool)  - Align display to whole seconds (use when no sub-second tokens)
 - addTextComp(comp|array)    - Add Text/Text3D component(s) to auto-update
 - clearTextComps()           - Remove all text components
 - setOnTick(callback)        - Called each tick with (time, formattedTime)
 - setOnComplete(callback)    - Called on completion with (time, formattedTime)
 - start(onComplete?)         - Start timer, optional callback shorthand
 - pause()                    - Pause the timer
 - resume()                   - Resume from paused state
 - stop()                     - Stop and reset the timer
 - reset()                    - Reset time to initial value without starting
 - getTime()                  - Get current time in seconds
 - getFormattedTime()         - Get current formatted time string
 - isRunning()                - Check if timer is active

 ==== Format Tokens ====
 h    - hours (no padding)        hh   - hours (2-digit padded)
 m    - minutes (no padding)      mm   - minutes (2-digit padded)
 s    - seconds (no padding)      ss   - seconds (2-digit padded)
 S    - tenths                    SS   - hundredths
 SSS  - milliseconds

 Format Examples:
    "mm:ss"    -> "01:30"
    ":ss"      -> ":09"
    "m:ss"     -> "1:30"
    "s"        -> "90" (total seconds when no h/m tokens)
    "ss.S"     -> "05.3"
    "h:mm:ss"  -> "1:02:30"
*/

//@input float maxTime = 10
//@input float tickInterval = 1
//@input bool countdown = true
//@input string format = "ss"
//@input bool wholeSecondsMode = false {"label":"Whole Seconds Mode"}
//@ui {"widget":"separator"}
//@input Component.Text[] textComponents
//@input Component.Text3D[] text3DComponents
//@ui {"widget":"separator"}
//@input bool editAdvancedOptions
//@ui {"widget":"group_start", "label":"Advanced Options", "showIf":"editAdvancedOptions"}
//@input bool printDebugStatements = false
//@input bool printWarningStatements = true
//@ui {"widget":"group_end"}

// ===== Configuration =====
var time = 0;
var maxTime = 10;
var tickInterval = 1; // seconds between ticks
var countUp = false;
var format = "ss"; // default format
var wholeSecondsMode = false;

var textComps = [];
var updateEvent = null;
var lastUpdateTime = 0;
var tickAccumulator = 0;

var onTick = null;
var onComplete = null;
var isRunning = false;

// ===== Public API =====

/**
 * Set the maximum time (end point for countdown, or target for countup)
 * @param {number} seconds - Time in seconds
 */
script.setMaxTime = function(seconds) {
    maxTime = seconds;
    printDebug("Max time set to " + seconds + "s");
    return script;
};

/**
 * Set the starting time (defaults to maxTime for countdown, 0 for countup)
 * @param {number} seconds - Time in seconds
 */
script.setStartTime = function(seconds) {
    time = seconds;
    printDebug("Start time set to " + seconds + "s");
    return script;
};

/**
 * Set the tick interval
 * @param {number} seconds - Interval between ticks (supports decimals like 0.1)
 */
script.setTickInterval = function(seconds) {
    tickInterval = Math.max(0.01, seconds); // minimum 10ms
    printDebug("Tick interval set to " + tickInterval + "s");
    return script;
};

/**
 * Set countdown (true) or countup (false) mode
 * @param {boolean} down - True for countdown, false for countup
 */
script.setCountdown = function(down) {
    countUp = !down;
    printDebug("Mode set to " + (countUp ? "count up" : "countdown"));
    return script;
};

/**
 * Set the display format string
 * @param {string} formatString - Format pattern (see tokens above)
 */
script.setFormat = function(formatString) {
    format = formatString;
    printDebug("Format set to '" + formatString + "'");
    return script;
};

/**
 * Enable whole seconds alignment for countdown display.
 * When on, uses Math.ceil so each whole-second value shows for a full tick
 * and the timer appears to stop at 0 rather than linger there.
 * Use when your format has no sub-second tokens (S, SS, SSS).
 * @param {boolean} enabled
 */
script.setWholeSecondsMode = function(enabled) {
    wholeSecondsMode = enabled;
    printDebug("Whole seconds mode " + (enabled ? "enabled" : "disabled"));
    return script;
};

/**
 * Add a text component to update with the timer value
 * @param {Component.Text|Component.Text3D|Array} comp - Text component(s)
 */
script.addTextComp = function(comp) {
    if (!comp) {
        printWarning("addTextComp received null/undefined component");
        return script;
    }
    
    if (Array.isArray(comp)) {
        for (var i = 0; i < comp.length; i++) {
            addSingleTextComp(comp[i]);
        }
    } else {
        addSingleTextComp(comp);
    }
    return script;
};

/**
 * Clear all text components
 */
script.clearTextComps = function() {
    textComps = [];
    printDebug("Text components cleared");
    return script;
};

/**
 * Set callback for each tick
 * @param {function} callback - Called with (currentTime, formattedTime)
 */
script.setOnTick = function(callback) {
    onTick = callback;
    return script;
};

/**
 * Set callback for timer completion
 * @param {function} callback - Called with (finalTime, formattedTime)
 */
script.setOnComplete = function(callback) {
    onComplete = callback;
    return script;
};

/**
 * Start the timer
 * @param {function} [completeCallback] - Optional onComplete callback
 */
script.start = function(completeCallback) {
    if (completeCallback) {
        onComplete = completeCallback;
    }
    
    // Set initial time based on direction
    if (countUp) {
        time = 0;
    } else {
        time = maxTime;
    }
    
    isRunning = true;
    updateText();

    lastUpdateTime = getTime();
    tickAccumulator = 0;
    
    // Create update event (frame-based)
    if (!updateEvent) {
        updateEvent = script.createEvent("UpdateEvent");
        updateEvent.bind(tick);
    }
    updateEvent.enabled = true;
    
    printDebug("Timer started - " + (countUp ? "counting up to " : "counting down from ") + maxTime + "s");
    return script;
};

/**
 * Pause the timer
 */
script.pause = function() {
    isRunning = false;
    printDebug("Timer paused at " + time + "s");
    return script;
};

/**
 * Resume the timer
 */
script.resume = function() {
    if (!isRunning) {
        lastUpdateTime = getTime(); // prevent jump
        isRunning = true;
        printDebug("Timer resumed from " + time + "s");
    }
    return script;
};

/**
 * Stop and reset the timer
 */
script.stop = function() {
    isRunning = false;
    time = countUp ? 0 : maxTime;
    updateText();
    printDebug("Timer stopped and reset");
    return script;
};

/**
 * Reset the timer to its initial value without starting it
 */
script.reset = function() {
    isRunning = false;
    time = countUp ? 0 : maxTime;
    updateText();
    printDebug("Timer reset to " + time + "s");
    return script;
};

/**
 * Get the current time in seconds
 * @returns {number}
 */
script.getTime = function() {
    return time;
};

/**
 * Get the formatted time string
 * @returns {string}
 */
script.getFormattedTime = function() {
    return formatTime(getDisplayTime());
};

/**
 * Check if timer is currently running
 * @returns {boolean}
 */
script.isRunning = function() {
    return isRunning;
};

// ===== Internal Functions =====

function addSingleTextComp(comp) {
    if (isTypeText(comp)) {
        textComps.push(comp);
        printDebug("Added text component");
    } else {
        printWarning("Component is not a Text or Text3D type");
    }
}

function isTypeText(comp) {
    if (!comp || typeof comp.isOfType !== "function") {
        return false;
    }
    return comp.isOfType("Component.Text") || comp.isOfType("Component.Text3D");
}

function tick() {
    if (!isRunning) return;

    var currentTime = getTime();
    var deltaTime = currentTime - lastUpdateTime;
    lastUpdateTime = currentTime;
    
    // Update time using REAL elapsed time
    if (countUp) {
        time += deltaTime;
    } else {
        time -= deltaTime;
    }
    
    // Clamp and check completion
    var completed = false;
    if (countUp && time >= maxTime) {
        time = maxTime;
        completed = true;
    } else if (!countUp && time <= 0) {
        time = 0;
        completed = true;
    }
    
    updateText();
    
    // Fire callbacks (throttled by tickInterval)
    tickAccumulator += deltaTime;
    
    var formatted = formatTime(time);
    
    if (tickAccumulator >= tickInterval) {
        tickAccumulator = 0;
        if (onTick) {
            onTick(time, formatted);
        }
    }
    
    if (completed) {
        isRunning = false;
        printDebug("Timer completed");
        if (onComplete) {
            onComplete(time, formatted);
        }
    }
}

function getDisplayTime() {
    if (wholeSecondsMode && !countUp) {
        return Math.min(Math.ceil(time), maxTime);
    }
    return time;
}

function updateText() {
    var formatted = formatTime(getDisplayTime());
    for (var i = 0; i < textComps.length; i++) {
        if (textComps[i] && textComps[i].text !== undefined) {
            textComps[i].text = formatted;
        }
    }
}

function formatTime(seconds) {
    var totalSeconds = Math.abs(seconds);
    var hours = Math.floor(totalSeconds / 3600);
    var minutes = Math.floor((totalSeconds % 3600) / 60);
    var secs = Math.floor(totalSeconds % 60);
    var fraction = totalSeconds - Math.floor(totalSeconds);
    
    var result = format;
    
    // Process tokens from longest to shortest to avoid partial replacements
    // Hours
    result = result.replace(/hh/g, padZero(hours, 2));
    result = result.replace(/h/g, String(hours));
    
    // Minutes
    result = result.replace(/mm/g, padZero(minutes, 2));
    result = result.replace(/m/g, String(minutes));
    
    // Seconds - check if format wants total seconds (no h or m tokens present)
    var hasTotalSeconds = format.indexOf("h") === -1 && format.indexOf("m") === -1;
    if (hasTotalSeconds) {
        // Use total seconds instead of remainder
        result = result.replace(/ss/g, padZero(Math.floor(totalSeconds), 2));
        result = result.replace(/s(?!S)/g, String(Math.floor(totalSeconds))); // negative lookahead for S
    } else {
        result = result.replace(/ss/g, padZero(secs, 2));
        result = result.replace(/s(?!S)/g, String(secs));
    }
    
    // Milliseconds/fractions
    var ms = Math.floor(fraction * 1000);
    result = result.replace(/SSS/g, padZero(ms, 3));
    result = result.replace(/SS/g, padZero(Math.floor(fraction * 100), 2));
    result = result.replace(/S/g, String(Math.floor(fraction * 10)));
    
    // Handle negative time (if somehow we go negative)
    if (seconds < 0) {
        result = "-" + result;
    }
    
    return result;
}

function padZero(num, length) {
    var str = String(num);
    while (str.length < length) {
        str = "0" + str;
    }
    return str;
}

function init(){
    // Load configuration from script inputs
    maxTime = script.maxTime || 10;
    tickInterval = Math.max(0.01, script.tickInterval || 1);
    countUp = !script.countdown;
    format = script.format || "ss";
    wholeSecondsMode = script.wholeSecondsMode || false;
    
    // Set initial time based on direction
    time = countUp ? 0 : maxTime;
    
    // Add inspector-configured text components
    if(script.textComponents) script.addTextComp(script.textComponents);
    if(script.text3DComponents) script.addTextComp(script.text3DComponents);
    
    // Initial text update
    updateText();
    
    printDebug("Script Initialized");
}

init();

// ===== Debug Functions =====
function printDebug(message) {
    if (script.printDebugStatements) {
        var newLog = "Timer - " + message;
        if (global.textLogger) {
            global.logToScreen(newLog);
        }
        print(newLog);
    }
}

function printWarning(message) {
    if (script.printWarningStatements) {
        var warningLog = "Timer - WARNING: " + message;
        if (global.textLogger) {
            global.logError(warningLog);
        }
        print(warningLog);
    }
}