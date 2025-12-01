// BaseTools.js
// Version: 0.1.0
// Description: Injects common utility functions directly onto a script reference.
// Author: Bennyp3333 [https://benjamin-p.dev]
//
// ----- USAGE -----
// 1. Call global.BaseTools(script) at the top of your script (after inputs)
// 2. Use injected functions directly: script.delay(1.0, callback)

var BaseTools = function(scriptRef) {
    var sceneObj = scriptRef.getSceneObject();
    
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
                print("!!ERROR!! tweenManager not found!");
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
            print("!!ERROR!! Audiotrack is not set!");
        }
        return audioComp;
    };
    
    return scriptRef;
};

if(script){
    script.exports = BaseTools;
    global.BaseTools = BaseTools;
}else{
    module.exports = BaseTools;
}