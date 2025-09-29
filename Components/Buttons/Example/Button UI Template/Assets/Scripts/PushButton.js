// PushButton.js
// Version: 0.0.1
// Event: On Awake
// Description: Trigger events by press.
//
// ----- USAGE -----
// Attach this script to a Scene Object with a Image Component.
// Button Id and Function Data are passed into custom/global functions
// Ex. otherScript.customFunction(buttonID int, onSelectFunctionData string)
//
// ----- LOCAL API USAGE -----
//
// Manually set interactability
// script.setInteractable(bool)
//
// Returns true if button is interactable
// script.isInteractable()
//
// Returns true if button is pressed-down
// script.isPressed()
//
// Returns buttonID
// script.getButtonID()
//
// Manually trigger button press
// script.press()
//
// -----------------

//@input bool interactable = true
//@input bool pressed = false
//@input int buttonID = 0

//@input bool moreOptions = false
//@ui {"widget":"group_start", "label":"More Options", "showIf":"moreOptions"}

//@ui {"widget":"separator"}
//@input bool pressOnStart = false;
//@input float delayTime {"showIf":"pressOnStart"}

//@ui {"widget":"separator"}
//@input bool editEventCallbacks = false
//@ui {"widget":"group_start", "label":"Event Callbacks", "showIf":"editEventCallbacks"}
//@input int callbackType = 0 {"widget":"combobox", "values":[{"label":"None", "value":0}, {"label":"Global Function", "value": 1}, {"label":"Custom Function", "value":2}]}

//@ui {"widget":"group_start", "label":"On Press", "showIf":"callbackType", "showIfValue":1}
//@input string onPressGlobalFunctionName {"label":"Function Name", "showIf":"callbackType", "showIfValue":1}
//@input string onPressGlobalFunctionData {"label":"Function Data", "showIf":"callbackType", "showIfValue":1}
//@ui {"widget":"group_end"}

//@input Component.ScriptComponent customFunctionScript {"showIf":"callbackType", "showIfValue":2}
//@ui {"widget":"separator", "showIf":"callbackType", "showIfValue":2}
//@ui {"widget":"group_start", "label":"On Press", "showIf":"callbackType", "showIfValue":2}
//@input string onPressFunctionName {"label":"Function Name", "showIf":"callbackType", "showIfValue":2}
//@input string onPressFunctionData {"label":"Function Data", "showIf":"callbackType", "showIfValue":2}
//@ui {"widget":"group_end"}

//@ui {"widget":"group_end"}

//@ui {"widget":"separator"}
//@input bool scaleOnPress = false;
//@input float pressedScale = 0.9 {"showIf":"scaleOnPress"}

//@ui {"widget":"separator"}
//@input bool colorOnPress = false;
//@input vec4 defaultColor = {1,1,1,1} {"widget":"color", "showIf":"colorOnPress"}
//@input vec4 pressedColor = {1,1,1,1} {"widget":"color", "showIf":"colorOnPress"}

//@ui {"widget":"separator"}
//@input bool useAudio = false;
//@input Asset.AudioTrackAsset tapAudioTrack {"showIf":"useAudio"}

//@ui {"widget":"separator"}
//@input bool editAdvancedOptions
//@ui {"widget":"group_start", "label":"Advanced Options", "showIf":"editAdvancedOptions"}
//@input bool touchBlockingEnabled = true
//@input bool printDebugStatements = false
//@input bool printWarningStatements = true
//@ui {"widget":"group_end"}

//@ui {"widget":"group_end"}

script.press = press;
script.setInteractable = setInteractable;
script.getButtonID = getButtonID;
script.isPressed = isPressed;
script.isInteractable = isInteractable;

var sceneObject = script.getSceneObject();
var button = sceneObject;
var buttonTransform = button.getTransform();
var buttonImage = button.getComponent("Component.Image");
button.createComponent("Component.InteractionComponent");

var tapAudioComp = script.getSceneObject().createComponent("Component.AudioComponent");

var pressDelay = script.createEvent("DelayedCallbackEvent");
pressDelay.bind(function(eventdata){
    press();
});

function init(){
    global.touchSystem.touchBlocking = script.touchBlockingEnabled;
    
    if(script.colorOnPress){
        buttonImage.mainPass.baseColor = script.pressed ? script.pressedColor : script.defaultColor;
    }
    
    if(script.useAudio){
        tapAudioComp.audioTrack = script.tapAudioTrack;
    }
    
    if(script.pressOnStart){
        pressDelay.reset(script.delayTime);
    }
}

init();

var touchStartEvent = script.createEvent("TouchStartEvent");
touchStartEvent.enabled = script.interactable;
touchStartEvent.bind(function(eventData){
    //printDebug("Button " + script.buttonID + " Press Down");
    script.pressed = true;
    if(script.colorOnPress){
        buttonImage.mainPass.baseColor = script.pressedColor;
    }
    if(script.scaleOnPress){
        buttonTransform.setLocalScale(vec3.one().uniformScale(script.pressedScale));
    }
});

var touchEndEvent = script.createEvent("TouchEndEvent");
touchEndEvent.enabled = script.interactable;
touchEndEvent.bind(function(eventData){
    //printDebug("Button " + script.buttonID + " Press Up");
    script.pressed = false;
    if(script.colorOnPress){
        buttonImage.mainPass.baseColor = script.defaultColor;
    }
    if(script.scaleOnPress){
        buttonTransform.setLocalScale(vec3.one());
    }
});

var tapEvent = script.createEvent("TapEvent");
tapEvent.enabled = script.interactable;
tapEvent.bind(function(eventData){
    //printDebug("Button " + script.buttonID + " Tapped");
    press();
});

function press(){
    printDebug("Button " + script.buttonID + " Pressed");
    if(script.useAudio){
        tapAudioComp.play(1);
    }
    pressCallback();
}

function pressCallback(){
    switch(script.callbackType){
        case 1:
            var globalFunction = global[script.onPressGlobalFunctionName];
            if(globalFunction){
                globalFunction(script.buttonID, script.onPressGlobalFunctionData);
            }else{
                printWarning("Global Function \"" + script.onPressGlobalFunctionName + "\" Not Defined");
            }
            break;
        case 2:
            if(script.customFunctionScript){
                var customFunction = script.customFunctionScript[script.onPressFunctionName];
                if(customFunction){
                    customFunction(script.buttonID, script.onPressFunctionData);
                }else{
                    printWarning("Custom Function \"" + script.onPressFunctionName + "\" Not Defined");
                }
            }else{
                printWarning("Custom Function Script Not Set");
            }
            break;
        default:
            if(script.editEventCallbacks){
                printWarning("Press Callback Not Set");
            }
    }
}

function setInteractable(bool){
    script.interactable = bool;
    touchStartEvent.enabled = bool;
    touchEndEvent.enabled = bool;
}

function getButtonID(){
    return script.buttonID;
}

function isPressed(){
    return script.pressed;
}

function isInteractable(){
    return script.interactable;
}

// Print debug messages
function printDebug(message){
    if(script.printDebugStatements){
        print("PushButton " + sceneObject.name + " - " + message);
    }
}

// Print warning message
function printWarning(message){
    if(script.printWarningStatements){
        print("PushButton " + sceneObject.name + " - WARNING, " + message);
    }
}