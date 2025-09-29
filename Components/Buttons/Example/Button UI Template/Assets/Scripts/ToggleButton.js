// ToggleButton.js
// Version: 0.0.1
// Event: On Awake
// Description: Trigger events by toggle.
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
// Returns true if interactable
// script.isInteractable()
//
// Returns true if selected
// script.isSelected()
//
// Returns buttonID
// script.getButtonID()
//
// Manually trigger selection
// script.select()
//
// Manually trigger deselection
// script.deselect()
//
// -----------------

//@input bool interactable = true
//@input bool selected = false
//@input int buttonID = 0
//@input Asset.Texture activeTexture
//@input Asset.Texture inactiveTexture

//@input bool moreOptions = false
//@ui {"widget":"group_start", "label":"More Options", "showIf":"moreOptions"}

//@ui {"widget":"separator"}
//@input bool selectOnStart = false;
//@input float delayTime {"showIf":"selectOnStart"}

//@ui {"widget":"separator"}
//@input bool editEventCallbacks = false
//@ui {"widget":"group_start", "label":"Event Callbacks", "showIf":"editEventCallbacks"}
//@input int callbackType = 0 {"widget":"combobox", "values":[{"label":"None", "value":0}, {"label":"Global Function", "value": 1}, {"label":"Custom Function", "value":2}]}

//@ui {"widget":"group_start", "label":"On Select", "showIf":"callbackType", "showIfValue":1}
//@input string onSelectGlobalFunctionName {"label":"Function Name", "showIf":"callbackType", "showIfValue":1}
//@input string onSelectGlobalFunctionData {"label":"Function Data", "showIf":"callbackType", "showIfValue":1}
//@ui {"widget":"group_end"}

//@ui {"widget":"separator", "showIf":"callbackType", "showIfValue":1}
//@ui {"widget":"group_start", "label":"On Deselect", "showIf":"callbackType", "showIfValue":1}
//@input string onDeselectGlobalFunctionName {"label":"Function Name", "showIf":"callbackType", "showIfValue":1}
//@input string onDeselectGlobalFunctionData {"label":"Function Data", "showIf":"callbackType", "showIfValue":1}
//@ui {"widget":"group_end"}

//@input Component.ScriptComponent customFunctionScript {"showIf":"callbackType", "showIfValue":2}
//@ui {"widget":"separator", "showIf":"callbackType", "showIfValue":2}
//@ui {"widget":"group_start", "label":"On Select", "showIf":"callbackType", "showIfValue":2}
//@input string onSelectFunctionName {"label":"Function Name", "showIf":"callbackType", "showIfValue":2}
//@input string onSelectFunctionData {"label":"Function Data", "showIf":"callbackType", "showIfValue":2}
//@ui {"widget":"group_end"}

//@ui {"widget":"separator", "showIf":"callbackType", "showIfValue":2}
//@ui {"widget":"group_start", "label":"On Deselect", "showIf":"callbackType", "showIfValue":2}
//@input string onDeselectFunctionName {"label":"Function Name", "showIf":"callbackType", "showIfValue":2}
//@input string onDeselectFunctionData {"label":"Function Data", "showIf":"callbackType", "showIfValue":2}
//@ui {"widget":"group_end"}

//@ui {"widget":"group_end"}

//@ui {"widget":"separator"}
//@input bool scaleOnPress = false;
//@input float pressedScale = 0.9 {"showIf":"scaleOnPress"}

//@ui {"widget":"separator"}
//@input bool useAudio = false;
//@input Asset.AudioTrackAsset selectAudioTrack {"showIf":"useAudio"}
//@input Asset.AudioTrackAsset deselectAudioTrack {"showIf":"useAudio"}

//@ui {"widget":"separator"}
//@input bool editAdvancedOptions
//@ui {"widget":"group_start", "label":"Advanced Options", "showIf":"editAdvancedOptions"}
//@input bool touchBlockingEnabled = true
//@input bool printDebugStatements = false
//@input bool printWarningStatements = true
//@ui {"widget":"group_end"}

//@ui {"widget":"group_end"}

script.select = select;
script.deselect = deselect;
script.setInteractable = setInteractable;
script.isSelected = isSelected;
script.getButtonID = getButtonID;
script.isInteractable = isInteractable;

var sceneObject = script.getSceneObject();
var button = sceneObject;
var buttonTransform = button.getTransform();
var buttonImage = button.getComponent("Component.Image");
button.createComponent("Component.InteractionComponent");

var partOfArray = false;
var arrayScript;

var selectAudioComp = script.getSceneObject().createComponent("Component.AudioComponent");
var deselectAudioComp = script.getSceneObject().createComponent("Component.AudioComponent");

var selectDelay = script.createEvent("DelayedCallbackEvent");
selectDelay.bind(function(eventdata){
    select();
});

function init(){
    global.touchSystem.touchBlocking = script.touchBlockingEnabled;
    
    if(script.activeTexture && script.inactiveTexture){
        buttonImage.mainPass.baseTex = script.selected ? script.activeTexture : script.inactiveTexture;
    }else{
        printWarning("Active and Inactive textures are missing");
        return;
    }
    
    if(script.useAudio){
        if(script.selectAudioTrack){
            selectAudioComp.audioTrack = script.selectAudioTrack;
        }
        if(script.deselectAudioTrack){
            deselectAudioComp.audioTrack = script.deselectAudioTrack;
        }
    }
    
    if(script.selectOnStart){
        selectDelay.reset(script.delayTime);
    }
    
    checkIfPartOfArray();
}

init();

function checkIfPartOfArray(){
    arrayScript = button.getParent().getComponent("Component.ScriptComponent");
    if(arrayScript && arrayScript.isButtonArray){
        partOfArray = true;
    }
}

var touchStartEvent = script.createEvent("TouchStartEvent");
touchStartEvent.enabled = script.interactable;
touchStartEvent.bind(function(eventData){
    if(script.scaleOnPress){
        buttonTransform.setLocalScale(vec3.one().uniformScale(script.pressedScale));
    }
});

var touchEndEvent = script.createEvent("TouchEndEvent");
touchEndEvent.enabled = script.interactable;
touchEndEvent.bind(function(eventData){
    if(script.scaleOnPress){
        buttonTransform.setLocalScale(vec3.one());
    }
});

var tapEvent = script.createEvent("TapEvent");
tapEvent.enabled = script.interactable;
tapEvent.bind(function(eventData){
    //printDebug("Button " + script.buttonID + " Tapped");
    if(script.selected){
        if(partOfArray){
            if(arrayScript.allowNoneSelected){
                deselect();
            }
        }else{
            deselect();
        }
    }else{
        select();
    }
});

function select(){
    if(!script.selected){
        printDebug("Button " + script.buttonID + " Selected");
        script.selected = true;
        if(script.useAudio && selectAudioComp.audioTrack){
            selectAudioComp.play(1);
        }
        buttonImage.mainPass.baseTex = script.activeTexture;
        if(partOfArray){
            arrayScript.childButtonSelected(script.buttonID);
        }
        selectCallback();
    }
}

function selectCallback(){
    if(partOfArray && arrayScript.callbackOverride){
        switch(script.callbackType){
            case 0:
                arrayScript.childButtonCallback(script.buttonID);
                break;
            case 1:
                arrayScript.childButtonCallback(script.buttonID, script.onSelectGlobalFunctionData);
                break;
            case 2:
                arrayScript.childButtonCallback(script.buttonID, script.onSelectFunctionData);
                break;
        }
    }else{
        switch(script.callbackType){
            case 1:
                var globalFunction = global[script.onSelectGlobalFunctionName];
                if(globalFunction){
                    globalFunction(script.buttonID, script.onSelectGlobalFunctionData);
                }else{
                    printWarning("Global Function \"" + script.onSelectGlobalFunctionName + "\" Not Defined");
                }
                break;
            case 2:
                if(script.customFunctionScript){
                    var customFunction = script.customFunctionScript[script.onSelectFunctionName];
                    if(customFunction){
                        customFunction(script.buttonID, script.onSelectFunctionData);
                    }else{
                        printWarning("Custom Function \"" + script.onSelectFunctionName + "\" Not Defined");
                    }
                }else{
                    printWarning("Custom Function Script Not Set");
                }
                break;
            default:
                if(script.editEventCallbacks){
                    printWarning("Select Callback Not Set");
                }
        }
    }
}

function deselect(){
    if(script.selected){
        printDebug("Button " + script.buttonID + " Deselected");
        script.selected = false;
        if(script.useAudio && deselectAudioComp.audioTrack){
            deselectAudioComp.play(1);
        }
        buttonImage.mainPass.baseTex = script.inactiveTexture;
        deselectCallback();
    }
}

function deselectCallback(){
    switch(script.callbackType){
        case 1:
            var globalFunction = global[script.onDeselectGlobalFunctionName]
            if(globalFunction){
                globalFunction(script.buttonID, script.onDeselectGlobalFunctionData);
            }
            break;
        case 2:
            if(script.customFunctionScript){
                var customFunction = script.customFunctionScript[script.onDeselectFunctionName];
                if(customFunction){
                    customFunction(script.buttonID, script.onDeselectFunctionData);
                }
            }else{
                printWarning("Custom Function Script Not Set");
            }
            break;
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

function isSelected(){
    return script.selected;
}

function isInteractable(){
    return script.interactable;
}

// Print debug messages
function printDebug(message){
    if(script.printDebugStatements){
        print("ToggleButton " + sceneObject.name + " - " + message);
    }
}

// Print warning message
function printWarning(message){
    if(script.printWarningStatements){
        print("ToggleButton " + sceneObject.name + " - WARNING, " + message);
    }
}