/**
 * Performs a simple tweening animation between a starting and ending value over a specified time.
 * The tweening effect updates at a fixed rate, and both an update and a completion callback can be provided.
 *
 * @param {number} startVal - The initial value from which to start the tween.
 * @param {number} endVal - The final value to reach by the end of the tween.
 * @param {number} time - The duration of the tween in seconds.
 * @param {number} delay - The delay before the tween starts, in seconds.
 * @param {function} [updateCallback] - Optional callback function to be called on each update with the current value.
 * @param {function} [doneCallback] - Optional callback function to be called when the tween completes with the final value.
 * @returns {Event} tweenUpdate - The update event tweening is binded to.
 */
function simpleTween(startVal, endVal, time, delay, updateCallback, doneCallback) {
    var elapsed = 0;
    var delayElapsed = 0;
    var range = endVal - startVal;

    var tweenUpdate = script.createEvent("UpdateEvent");
    tweenUpdate.bind(function(eventData) {
        var dt = getDeltaTime();

        if (delayElapsed < delay) {
            delayElapsed += dt;
            return;
        }

        elapsed += dt;
        var t = Math.min(elapsed / time, 1);

        var val = startVal + range * t;
        if (updateCallback) {
            updateCallback(val);
        }

        if (t >= 1) {
            if (doneCallback) {
                doneCallback(val);
            }
            tweenUpdate.enabled = false;
        }
    });

    return tweenUpdate;
}

var exports = {
    simpleTween
};

if(script){
    script.exports = exports;
    global.simpleTween = simpleTween;
}else{
    module.exports = exports;
}