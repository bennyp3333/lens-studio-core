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
    var acc = 0;
    var step = (endVal - startVal) / (30 * time);
    var inOut = endVal > startVal;
    var val = startVal;
    var tweenUpdate = script.createEvent("UpdateEvent");
    tweenUpdate.bind(function(eventData) {
        if (acc >= delay) {
            val += step;
            if ((inOut && val >= endVal) || (!inOut && val <= endVal)) {
                if (updateCallback) {
                    updateCallback(endVal);
                }
                if (doneCallback) {
                    doneCallback(endVal);
                }
                tweenUpdate.enabled = false;
            } else {
                if (updateCallback) {
                    updateCallback(val);
                }
            }
        } else {
            acc += getDeltaTime();
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