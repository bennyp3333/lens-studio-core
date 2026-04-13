// AsyncUtils.js
// Version: 1.0.0
// Description: Promise-based async utilities. Includes script-bound helpers via AsyncBaseTools
//              and standalone async utility functions accessible via global.utils.
// Author: Bennyp3333 [https://benjamin-p.dev]
//
// ----- USAGE -----
// Script-bound async methods (AsyncBaseTools injection):
//   1. Call global.AsyncBaseTools(script) at the top of your script (after inputs)
//   2. Use injected functions directly: await script.delayAsync(1.0)
//
// Standalone async utilities:
//   Access via global.utils after this script is initialized in your scene

var AsyncBaseTools = function(scriptRef) {

    /**
     * Returns a Promise that resolves after the given number of seconds.
     * @param {number} seconds - The delay duration in seconds.
     * @returns {Promise<void>}
     */
    scriptRef.delayAsync = function(seconds) {
        return new Promise(function(resolve) {
            var delayedEvent = scriptRef.createEvent("DelayedCallbackEvent");
            delayedEvent.bind(function() {
                resolve();
            });
            delayedEvent.reset(seconds);
        });
    };

    /**
     * Returns a Promise that resolves when the specified tween completes.
     * Requires global.tweenManager to be available.
     * @param {SceneObject} sceneObject - The object containing the tween.
     * @param {string} tweenName - The name of the tween to play.
     * @returns {Promise<void>}
     */
    scriptRef.playTweenAsync = function(sceneObject, tweenName) {
        return new Promise(function(resolve) {
            global.tweenManager.startTween(sceneObject, tweenName, function() {
                resolve();
            });
        });
    };

    return scriptRef;
};

// Exporting the functions
var exports = {};

if(script){
    script.exports = Object.assign({ AsyncBaseTools: AsyncBaseTools }, exports);
    global.AsyncBaseTools = AsyncBaseTools;
    if(!global.utils){ global.utils = {}; }
    Object.assign(global.utils, exports);
}else{
    module.exports = Object.assign({ AsyncBaseTools: AsyncBaseTools }, exports);
}
