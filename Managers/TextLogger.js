// ScreenLogger.js
// Version: 2.1.0
// Event: Awake
// Description: Prints the given message on the screen

// ----- USAGE -----
// To log text to the screen, use: 
// 	global.logToScreen(text);
// or:
// 	global.textLogger.addLog(text);
//
// To clear the text log, use:
// 	global.textLogger.clear();
//
// To change the log limit, use:
// 	global.textLogger.setLogLimit(limit);
//
// To change the text color, use:
// 	global.textLogger.setTextColor(colorRGBA);
//
// To enable or disable logging, use:
// 	global.textLogger.setLoggingEnabled(limit);
// -----------------

//@input bool loggingEnabled = true
//@input int logLimit = 20
//@input bool logTopToBottom = false
//@input Component.Text textComponent
//@input bool useUniqueLayer
//@input Component.Camera camera {"showIf":"useUniqueLayer"}

var defaultColor = new vec4(0.5, 1.0, 0.5, 1.0);
var errorColor = new vec4(1.0, 0.0, 0.0, 1.0);

var textComponent = null;

var stringLength = 36;
var queue = [];

var isError = false;

function init() {
    textComponent = script.textComponent || script.getSceneObject().getComponent("Component.Text");

    if (script.useUniqueLayer && script.camera) {
        var newLayer = LayerSet.makeUnique();
        script.camera.renderLayer = newLayer;
        textComponent.getSceneObject().layer = newLayer;
    }

    if (!textComponent) {
        print("Text component not set on " + script.getSceneObject().name);
    }
}

global.textLogger = {
    setLoggingEnabled: function(state) {
        script.loggingEnabled = state;
    },

    setTextColor: function(color) {
        if (textComponent) {
            textComponent.textFill.color = color;
        }
    },

    setLogLimit: function(limit) {
        script.logLimit = limit;
    },

    clear: function() {
        if (textComponent) {
            textComponent.text = "";
        }
        queue = [];
    },

    clearError: function() {
        isError = false;
    },
    
    addLog: function(message){
        if (!script.loggingEnabled) {
            return;
        }
        
        if (isError) {
            this.setTextColor(errorColor);
        } else {
            this.setTextColor(defaultColor);
        }
        
        if (queue.length >= script.logLimit) {
            if(script.logTopToBottom){
                queue.pop();
            }else{
                queue.shift();
            }
            
        }
        
        if(script.logTopToBottom){
            queue.unshift(message.toString());
        }else{
           queue.push(message.toString()); 
        }
        
        var combText = "> " + queue.join("\n> ");
        var croppedMessage = combText.substring(message.length - stringLength * script.logLimit);
        if (textComponent) {
            textComponent.text = croppedMessage;
        }
    },
    
    addErrorLog: function(message){
        isError = true;
        this.addLog(message);
    }
};

global.logToScreen = function(message) {
    global.textLogger.addLog(message);
}

global.logError = function(message) {
    global.textLogger.addErrorLog(message);
}

script.createEvent("OnStartEvent").bind(init);