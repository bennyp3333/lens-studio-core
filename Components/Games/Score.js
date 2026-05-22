/*
Score.js
Version: 1.0.0
Description: Generalized score tracking utility for Lens Studio
Author: Bennyp3333 [https://benjamin-p.dev]

 ==== Usage ====
 Add this script to a SceneObject.
 Optionally add Text/Text3D components via the inspector.
 Reference this script from another script and call score methods.

 ==== Examples ====
 
 // Basic score tracking with text display
 script.score.addTextComp(script.scoreText)
     .setOnChange(function(score, formatted) {
         print("Score changed: " + formatted);
     })
     .reset();

 // Increment/decrement with custom amounts
 script.score.increment();      // +1
 script.score.increment(10);    // +10
 script.score.decrement(5);     // -5

 // High score tracking with persistent storage
 script.score.enableHighScore()  // uses default "highScore" key
     .addHighScoreTextComp(script.highScoreText)
     .setOnNewHighScore(function(score, formatted) {
         print("New High Score: " + formatted);
     });

 // Custom formatting with prefix/suffix
 script.score.setPrefix("Score: ")
     .setSuffix(" pts")
     .setPadding(4);  // "Score: 0042 pts"

 // Multiplier system for combos
 script.score.setMultiplier(2);
 script.score.increment(10);    // Actually adds 20
 script.score.resetMultiplier();

 ==== API ====
 - setScore(value)              - Set score to specific value
 - getScore()                   - Get current score
 - increment(amount?)           - Add to score (default: 1), affected by multiplier
 - decrement(amount?)           - Subtract from score (default: 1)
 - reset()                      - Reset score to 0
 - getFormattedScore()          - Get formatted score string
 - addTextComp(comp|array)      - Add Text/Text3D component(s) to auto-update
 - clearTextComps()             - Remove all text components
 - addHighScoreTextComp(comp|array) - Add Text/Text3D for high score display
 - clearHighScoreTextComps()    - Remove all high score text components
 - setPrefix(string)            - Set prefix for formatted output
 - setSuffix(string)            - Set suffix for formatted output
 - setPadding(digits)           - Set zero-padding length (0 = no padding)
 - setMinScore(value)           - Set minimum allowed score (default: 0)
 - setMaxScore(value)           - Set maximum allowed score (default: null/unlimited)
 - setMultiplier(value)         - Set score multiplier for increment()
 - getMultiplier()              - Get current multiplier
 - resetMultiplier()            - Reset multiplier to 1
 - enableHighScore(storageKey?) - Enable high score tracking (default key: "highScore")
 - disableHighScore()           - Disable high score tracking
 - getHighScore()               - Get current high score
 - getFormattedHighScore()      - Get formatted high score string
 - resetHighScore()             - Reset high score to 0
 - isNewHighScore()             - Check if current score exceeds high score
 - setOnChange(callback)        - Called on any score change with (score, formatted)
 - setOnNewHighScore(callback)  - Called when new high score achieved with (score, formatted)
*/

//@input string prefix = ""
//@input string suffix = ""
//@input int padding = 0
//@ui {"widget":"separator"}
//@input int minScore = 0
//@input bool useMaxScore = false
//@input int maxScore = 100 {"showIf":"useMaxScore"}
//@input float multiplier = 1.0
//@ui {"widget":"separator"}
//@input Component.Text[] textComponents
//@input Component.Text3D[] text3DComponents
//@ui {"widget":"separator"}
//@input bool enableHighScoreTracking = false
//@input string highScoreStorageKey = "highScore" {"showIf":"enableHighScoreTracking"}
//@input Component.Text[] highScoreTextComponents {"showIf":"enableHighScoreTracking"}
//@input Component.Text3D[] highScoreText3DComponents {"showIf":"enableHighScoreTracking"}
//@ui {"widget":"separator"}
//@input bool editAdvancedOptions
//@ui {"widget":"group_start", "label":"Advanced Options", "showIf":"editAdvancedOptions"}
//@input bool printDebugStatements = false
//@input bool printWarningStatements = true
//@ui {"widget":"group_end"}

// ===== Configuration =====
var score = 0;
var minScore = 0;
var maxScore = null; // null = unlimited
var multiplier = 1;

var prefix = "";
var suffix = "";
var padding = 0;

var textComps = [];
var highScoreTextComps = [];
var onChange = null;
var onNewHighScore = null;

// High score tracking
var highScoreEnabled = false;
var highScoreKey = null;
var highScore = 0;
var store = null;

// ===== Public API =====

/**
 * Set the score to a specific value
 * @param {number} value - The score value to set
 */
script.setScore = function(value) {
    var oldScore = score;
    score = clampScore(value);
    
    if (score !== oldScore) {
        printDebug("Score set to " + score);
        updateText();
        fireOnChange();
        checkHighScore();
    }
    return script;
};

/**
 * Get the current score
 * @returns {number}
 */
script.getScore = function() {
    return score;
};

/**
 * Increment the score by an amount (affected by multiplier)
 * @param {number} [amount=1] - Amount to add
 */
script.increment = function(amount) {
    var delta = (amount !== undefined ? amount : 1) * multiplier;
    var oldScore = score;
    score = clampScore(score + delta);
    
    if (score !== oldScore) {
        printDebug("Score incremented by " + delta + " (multiplier: " + multiplier + ") -> " + score);
        updateText();
        fireOnChange();
        checkHighScore();
    }
    return script;
};

/**
 * Decrement the score by an amount (NOT affected by multiplier)
 * @param {number} [amount=1] - Amount to subtract
 */
script.decrement = function(amount) {
    var delta = amount !== undefined ? amount : 1;
    var oldScore = score;
    score = clampScore(score - delta);
    
    if (score !== oldScore) {
        printDebug("Score decremented by " + delta + " -> " + score);
        updateText();
        fireOnChange();
    }
    return script;
};

/**
 * Reset the score to 0 (or minScore if set higher)
 */
script.reset = function() {
    var oldScore = score;
    score = Math.max(0, minScore);
    
    if (score !== oldScore) {
        printDebug("Score reset to " + score);
        updateText();
        fireOnChange();
    }
    return script;
};

/**
 * Get the formatted score string
 * @returns {string}
 */
script.getFormattedScore = function() {
    return formatScore(score);
};

/**
 * Add a text component to update with the score value
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
 * Add a text component to update with the high score value
 * @param {Component.Text|Component.Text3D|Array} comp - Text component(s)
 */
script.addHighScoreTextComp = function(comp) {
    if (!comp) {
        printWarning("addHighScoreTextComp received null/undefined component");
        return script;
    }
    
    if (Array.isArray(comp)) {
        for (var i = 0; i < comp.length; i++) {
            addSingleHighScoreTextComp(comp[i]);
        }
    } else {
        addSingleHighScoreTextComp(comp);
    }
    return script;
};

/**
 * Clear all high score text components
 */
script.clearHighScoreTextComps = function() {
    highScoreTextComps = [];
    printDebug("High score text components cleared");
    return script;
};

/**
 * Set prefix for formatted output
 * @param {string} str - Prefix string
 */
script.setPrefix = function(str) {
    prefix = str || "";
    printDebug("Prefix set to '" + prefix + "'");
    updateText();
    return script;
};

/**
 * Set suffix for formatted output
 * @param {string} str - Suffix string
 */
script.setSuffix = function(str) {
    suffix = str || "";
    printDebug("Suffix set to '" + suffix + "'");
    updateText();
    return script;
};

/**
 * Set zero-padding length for score display
 * @param {number} digits - Number of digits to pad to (0 = no padding)
 */
script.setPadding = function(digits) {
    padding = Math.max(0, Math.floor(digits));
    printDebug("Padding set to " + padding + " digits");
    updateText();
    return script;
};

/**
 * Set minimum allowed score
 * @param {number} value - Minimum score value
 */
script.setMinScore = function(value) {
    minScore = value;
    score = clampScore(score);
    printDebug("Min score set to " + minScore);
    updateText();
    return script;
};

/**
 * Set maximum allowed score (null for unlimited)
 * @param {number|null} value - Maximum score value or null
 */
script.setMaxScore = function(value) {
    maxScore = value;
    score = clampScore(score);
    printDebug("Max score set to " + (maxScore !== null ? maxScore : "unlimited"));
    updateText();
    return script;
};

/**
 * Set score multiplier (affects increment only)
 * @param {number} value - Multiplier value
 */
script.setMultiplier = function(value) {
    multiplier = Math.max(0, value);
    printDebug("Multiplier set to " + multiplier);
    return script;
};

/**
 * Get current multiplier
 * @returns {number}
 */
script.getMultiplier = function() {
    return multiplier;
};

/**
 * Reset multiplier to 1
 */
script.resetMultiplier = function() {
    multiplier = 1;
    printDebug("Multiplier reset to 1");
    return script;
};

/**
 * Enable high score tracking with persistent storage
 * @param {string} [storageKey="highScore"] - Key to use for persistent storage
 */
script.enableHighScore = function(storageKey) {
    highScoreKey = storageKey || "highScore";
    highScoreEnabled = true;
    
    // Initialize persistent storage
    if (global.persistentStorageSystem) {
        store = global.persistentStorageSystem.store;
        
        // Load existing high score
        try {
            highScore = store.getInt(highScoreKey) || 0;
            printDebug("High score loaded: " + highScore);
        } catch (e) {
            highScore = 0;
            printDebug("No existing high score found, starting at 0");
        }
        
        // Handle storage full
        store.onStoreFull = function() {
            printWarning("Persistent storage full, clearing...");
            store.clear();
        };
    } else {
        printWarning("persistentStorageSystem not available, high scores will not persist");
        highScore = 0;
    }
    
    return script;
};

/**
 * Disable high score tracking
 */
script.disableHighScore = function() {
    highScoreEnabled = false;
    highScoreKey = null;
    printDebug("High score tracking disabled");
    return script;
};

/**
 * Get the current high score
 * @returns {number}
 */
script.getHighScore = function() {
    return highScore;
};

/**
 * Get the formatted high score string
 * @returns {string}
 */
script.getFormattedHighScore = function() {
    return formatScore(highScore);
};

/**
 * Reset high score to 0
 */
script.resetHighScore = function() {
    highScore = 0;
    if (store && highScoreKey) {
        store.putInt(highScoreKey, 0);
    }
    updateHighScoreText();
    printDebug("High score reset to 0");
    return script;
};

/**
 * Check if current score exceeds high score
 * @returns {boolean}
 */
script.isNewHighScore = function() {
    return highScoreEnabled && score > highScore;
};

/**
 * Set callback for score changes
 * @param {function} callback - Called with (score, formattedScore)
 */
script.setOnChange = function(callback) {
    onChange = callback;
    return script;
};

/**
 * Set callback for new high score
 * @param {function} callback - Called with (score, formattedScore)
 */
script.setOnNewHighScore = function(callback) {
    onNewHighScore = callback;
    return script;
};

// ===== Internal Functions =====

function addSingleTextComp(comp) {
    if (isTypeText(comp)) {
        textComps.push(comp);
        printDebug("Added text component");
        // Update immediately with current score
        if (comp.text !== undefined) {
            comp.text = formatScore(score);
        }
    } else {
        printWarning("Component is not a Text or Text3D type");
    }
}

function addSingleHighScoreTextComp(comp) {
    if (isTypeText(comp)) {
        highScoreTextComps.push(comp);
        printDebug("Added high score text component");
        // Update immediately with current high score
        if (comp.text !== undefined) {
            comp.text = formatScore(highScore);
        }
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

function clampScore(value) {
    var clamped = value;
    if (minScore !== null) {
        clamped = Math.max(minScore, clamped);
    }
    if (maxScore !== null) {
        clamped = Math.min(maxScore, clamped);
    }
    return clamped;
}

function formatScore(value) {
    var scoreStr = String(Math.floor(value));
    
    // Apply zero padding
    if (padding > 0) {
        while (scoreStr.length < padding) {
            scoreStr = "0" + scoreStr;
        }
    }
    
    return prefix + scoreStr + suffix;
}

function updateText() {
    var formatted = formatScore(score);
    for (var i = 0; i < textComps.length; i++) {
        if (textComps[i] && textComps[i].text !== undefined) {
            textComps[i].text = formatted;
        }
    }
}

function updateHighScoreText() {
    var formatted = formatScore(highScore);
    for (var i = 0; i < highScoreTextComps.length; i++) {
        if (highScoreTextComps[i] && highScoreTextComps[i].text !== undefined) {
            highScoreTextComps[i].text = formatted;
        }
    }
}

function fireOnChange() {
    if (onChange) {
        onChange(score, formatScore(score));
    }
}

function checkHighScore() {
    if (!highScoreEnabled) return;
    
    if (score > highScore) {
        highScore = score;
        printDebug("New high score: " + highScore);
        
        // Save to persistent storage
        if (store && highScoreKey) {
            store.putInt(highScoreKey, highScore);
        }
        
        // Update high score text displays
        updateHighScoreText();
        
        // Fire callback
        if (onNewHighScore) {
            onNewHighScore(highScore, formatScore(highScore));
        }
    }
}

function init() {
    // Load configuration from script inputs
    prefix = script.prefix || "";
    suffix = script.suffix || "";
    padding = Math.max(0, script.padding || 0);
    minScore = script.minScore || 0;
    maxScore = script.useMaxScore ? script.maxScore : null;
    multiplier = script.multiplier || 1;
    
    // Add inspector-configured text components
    if (script.textComponents) {
        script.addTextComp(script.textComponents);
    }
    if (script.text3DComponents) {
        script.addTextComp(script.text3DComponents);
    }
    
    // Enable high score if configured in inspector
    if (script.enableHighScoreTracking) {
        script.enableHighScore(script.highScoreStorageKey);
        
        // Add inspector-configured high score text components
        if (script.highScoreTextComponents) {
            script.addHighScoreTextComp(script.highScoreTextComponents);
        }
        if (script.highScoreText3DComponents) {
            script.addHighScoreTextComp(script.highScoreText3DComponents);
        }
    }
    
    // Initial text update
    updateText();
    
    printDebug("Script Initialized");
}

init();

// ===== Debug Functions =====
function printDebug(message) {
    if (script.printDebugStatements) {
        var newLog = "Score - " + message;
        if (global.textLogger) {
            global.logToScreen(newLog);
        }
        print(newLog);
    }
}

function printWarning(message) {
    if (script.printWarningStatements) {
        var warningLog = "Score - WARNING: " + message;
        if (global.textLogger) {
            global.logError(warningLog);
        }
        print(warningLog);
    }
}