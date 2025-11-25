// BaseTools.js
// Version: 0.1.0
// Description: Injects common utility functions directly onto a script reference.
//  Provides simple delay utilities, audio helpers, and debug printing without needing
//  a separate tools object. Lightweight alternative to DelayManager for quick one-off operations.
// Author: Bennyp3333 [https://benjamin-p.dev]
//
// ----- USAGE -----
// 1. Call global.BaseTools(script) at the top of your script (after inputs)
// 2. Use injected functions directly: script.delay(1.0, callback), script.debugPrint("msg")
//
// ----- DEBUG INPUTS -----
// Add these inputs to enable debug functionality:
/*
//@ input bool debug
//@ input string debugName = "" {"showIf":"debug"}
//@ input Component.Text debugText {"showIf":"debug"}
*/

var BaseTools = function(scriptRef) {
    var sceneObj = scriptRef.getSceneObject();
    var debugEnabled = scriptRef.debug || false;
    var debugName = scriptRef.debugName || "";
    var debugText = scriptRef.debugText || null;
    
    /**
     * Executes a callback after a delay.
     * @param {number} delayTime - Seconds to wait
     * @param {function} callback - Function to execute
     * @returns {DelayedCallbackEvent} Event object (set .enabled = false to cancel)
     */
    scriptRef.delay = function(delayTime, callback) {
        var delayedEvent = scriptRef.createEvent("DelayedCallbackEvent");
        delayedEvent.bind(callback);
        delayedEvent.reset(delayTime);
        return delayedEvent;
    };
    
    /**
     * Starts a tween after a delay. Requires global.tweenManager.
     * @param {number} delayTime - Seconds to wait
     * @param {SceneObject} object - Object containing the tween
     * @param {string} tweenName - Name of the tween
     */
    scriptRef.delayTween = function(delayTime, object, tweenName) {
        var delayedEvent = scriptRef.createEvent("DelayedCallbackEvent");
        delayedEvent.bind(function() {
            if (global.tweenManager) {
                global.tweenManager.startTween(object, tweenName);
            } else {
                scriptRef.errorPrint("tweenManager not found!");
            }
        });
        delayedEvent.reset(delayTime);
        return delayedEvent;
    };
    
    /**
     * Plays or stops audio after a delay.
     * @param {number} delayTime - Seconds to wait
     * @param {string} action - "play" or "stop"
     * @param {AudioComponent} audio - Audio component to control
     * @param {number} loops - Loop count for "play" action
     */
    scriptRef.delayAudio = function(delayTime, action, audio, loops) {
        var delayedEvent = scriptRef.createEvent("DelayedCallbackEvent");
        delayedEvent.bind(function() {
            if (action == "play") {
                audio.play(loops);
            } else {
                if (audio.isPlaying()) {
                    audio.stop(true);
                }
            }        
        });
        delayedEvent.reset(delayTime);
        return delayedEvent;
    };
    
    /**
     * Enables or disables a SceneObject after a delay.
     * @param {number} delayTime - Seconds to wait
     * @param {SceneObject} object - Object to toggle
     * @param {boolean} state - True to enable, false to disable
     */
    scriptRef.delayEnable = function(delayTime, object, state) {
        var delayedEvent = scriptRef.createEvent("DelayedCallbackEvent");
        delayedEvent.bind(function() {
            object.enabled = state;  
        });
        delayedEvent.reset(delayTime);
        return delayedEvent;
    };
    
    /**
     * Creates an AudioComponent on this script's SceneObject.
     * @param {AudioTrackAsset} [audioTrack] - Audio track to assign
     * @returns {AudioComponent}
     */
    scriptRef.createAudioComp = function(audioTrack) {
        var audioComp = sceneObj.createComponent("Component.AudioComponent");
        if (audioTrack) {
            audioComp.audioTrack = audioTrack;
        } else {
            scriptRef.errorPrint("Audiotrack is not set!");
        }
        return audioComp;
    };
    
    /**
     * Prints a debug message (only if script.debug is true).
     * @param {string} text - Message to print
     */
    scriptRef.debugPrint = function(text) {
        if (!debugEnabled) return;
        var newLog = (debugName || sceneObj.name) + ": " + text;
        if (global.textLogger) global.logToScreen(newLog);
        if (debugText) debugText.text = newLog;
        print(newLog);
    };
    
    /**
     * Prints an error message (always prints regardless of debug setting).
     * @param {string} text - Error message to print
     */
    scriptRef.errorPrint = function(text) {
        var errorLog = "!!ERROR!! " + (debugName || sceneObj.name) + ": " + text;
        if (global.textLogger) global.logError(errorLog);
        if (debugText) debugText.text = errorLog;
        print(errorLog);
    };
    
    return scriptRef;
};

if(script){
    script.exports = BaseTools;
    global.BaseTools = BaseTools;
}else{
    module.exports = BaseTools;
}