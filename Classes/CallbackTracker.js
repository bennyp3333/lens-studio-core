global.CallbackTracker = CallbackTracker;

function removeFromArray(array, element) {
    var index = array.indexOf(element);
    if (index > -1) {
        array.splice(index, 1);
        return true;
    }
    return false;
}

function CallbackTracker(scriptComponent) {
    this.scriptComponent = scriptComponent;
    this.callbackType = scriptComponent.callbackType;

    this.customCallbacks = [];
}

CallbackTracker.prototype = {
    addCallback: function(eventName, callback) {
        if (this.customCallbacks[eventName]) {
            this.customCallbacks[eventName].push(callback);
        } else {
            this.customCallbacks[eventName] = [callback];
        }
    },

    // Remove callback from event
    removeCallback: function(eventName, callback) {
        if (!this.customCallbacks[eventName]) {
            print(eventName + " Event does not exist!");
            return;
        }

        if (!removeFromArray(this.customCallbacks[eventName], callback)) {
            print("The callback does not exist!");
        }
    },

    invokeAllCallbacks: function(eventName, eventData) {
        this.invokeCallbacks(eventName, eventData);
        this.invokeScriptedCallbacks(eventName, eventData);
    },

    invokeScriptedCallbacks: function(eventName, eventData) {
        var callbacks = this.customCallbacks[eventName];
        if (callbacks) {
            for (var i = 0; i < callbacks.length; i++) {
                callbacks[i](eventData);
            }
        }
    },

    invokeCallbacks: function(eventName, eventData) {
        switch (this.callbackType) {
            case 1: // Behavior
                var behaviors = this.scriptComponent[eventName + "Behaviors"];
                if (!behaviors) {
                    print("WARNING: no event with name: " + eventName);
                    return;
                }
                for (var i = 0; i < behaviors.length; i++) {
                    if (behaviors[i] && behaviors[i].api.trigger) {
                        behaviors[i].api.trigger();
                    }
                }
                break;
            case 2: // Global Behavior
                if (!global.behaviorSystem) {
                    print("The global behavior system has not been instantiated yet! Make sure a Behavior script is present somewhere!");
                    return;
                }
                var triggerNames = this.scriptComponent[eventName + "GlobalBehaviors"];
                for (var j = 0; j < triggerNames.length; j++) {
                    if (triggerNames[j].length == 0) {
                        print("You are trying to send an empty string custom trigger!");
                        continue;
                    }
                    global.behaviorSystem.sendCustomTrigger(triggerNames[j]);
                }
                break;
            case 3: // Custom Functions
                var otherScript = this.scriptComponent.customFunctionScript;
                if (!otherScript) {
                    print("Does not have a Script Component with custom functions assigned, but you are trying to invoke custom callbacks!");
                    return;
                }
                var functionNames = this.scriptComponent[eventName + "FunctionNames"];
                for (var k = 0; k < functionNames.length; k++) {
                    if (functionNames[k].length == 0) {
                        print("You are trying to invoke an empty string function!");
                        continue;
                    }
                    if (!otherScript.api[functionNames[k]]) {
                        print("Cannot find the " + functionNames[k] + " function in the assigned Script Component!");
                        continue;
                    }
                    otherScript.api[functionNames[k]](eventData);
                }
                break;
        }
    }
};