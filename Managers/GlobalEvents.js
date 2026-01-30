/*
GlobalEvents.js
Version: 1.0.0
Description: Global event system for triggering, adding, and removing custom event callbacks.
Author: Bennyp3333 [https://benjamin-p.dev]
*/

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
