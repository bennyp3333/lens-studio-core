// -----JS CODE-----

////// GLOBAL EVENT SYSTEM ////////////////////////////////////////////////

var callbackTracker = null;
if (global.CallbackTracker) {
    callbackTracker = new global.CallbackTracker(script);
} else {
    print("ERROR: Please add global CallbackTracker");
}

// Easier names to remember: 
global.events = {};
global.events.trigger = function(key, data) { callbackTracker.invokeAllCallbacks(key, data) };
global.events.add = function(key, func){ callbackTracker.addCallback(key, func) };
global.events.remove = function(key, func){ callbackTracker.removeCallback(key, func) };
