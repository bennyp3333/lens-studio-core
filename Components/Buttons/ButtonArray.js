// ButtonArray.js
// Version: 0.0.1
// Event: On Awake
// Description: Controls array of Toggle Buttons.
//
// ----- USAGE -----
// Attach this script to a Scene Object that is parented to Toggle Buttons.
// Button Id, Buttton Data and Function Data are passed into custom/global functions
// Ex. otherScript.api.customFunction(buttonID int, buttonData string, onSelectFunctionData string)
//
// ----- LOCAL API USAGE -----
//
// Returns true if overriding child button functions
// script.api.isButtonArray()
//
// Returns true if overriding child button callbacks
// script.api.callbackOverride()
//
// Returns true if child buttons are allowed to deselect themselves
// script.api.allowNoneSelected()
//
// Trigger when child button is selected
// script.api.childButtonSelected()
//
// Trigger when child button calls back
// script.api.childButtonCallback()
//
// -----------------

//@input bool connectButtons = true;
//@ui {"widget":"group_start", "label":"Button Connections", "showIf":"connectButtons"}
//@ui {"widget":"separator"}
//@ui {"widget":"group_start", "label":"Button Selection"}
//@input bool allowMultiple = false
//@ui {"widget":"separator"}
//@input bool allowNone = false
//@ui {"widget":"group_start", "label":"On Start", "showIf":"allowNone", "showIfValue":false}
//@input bool forceSelect = true
//@ui {"widget":"group_end"}

//@ui {"widget":"group_end"}

//@ui {"widget":"separator"}
//@input bool overrideEventCallbacks = false
//@ui {"widget":"group_start", "label":"Event Callbacks", "showIf":"overrideEventCallbacks"}
//@input int callbackType = 0 {"widget":"combobox", "values":[{"label":"None", "value":0}, {"label":"Global Function", "value": 1}, {"label":"Custom Function", "value":2}]}

//@ui {"widget":"group_start", "label":"On Select", "showIf":"callbackType", "showIfValue":1}
//@input string onSelectGlobalFunctionName {"label":"Function Name", "showIf":"callbackType", "showIfValue":1}
//@input string onSelectGlobalFunctionData {"label":"Function Data", "showIf":"callbackType", "showIfValue":1}
//@ui {"widget":"group_end"}

//@input Component.ScriptComponent customFunctionScript {"showIf":"callbackType", "showIfValue":2}
//@ui {"widget":"separator", "showIf":"callbackType", "showIfValue":2}
//@ui {"widget":"group_start", "label":"On Select", "showIf":"callbackType", "showIfValue":2}
//@input string onSelectFunctionName {"label":"Function Name", "showIf":"callbackType", "showIfValue":2}
//@input string onSelectFunctionData {"label":"Function Data", "showIf":"callbackType", "showIfValue":2}
//@ui {"widget":"group_end"}

//@ui {"widget":"group_end"}

//@ui {"widget":"group_end"}

//@ui {"widget":"separator"}
//@input bool editAdvancedOptions
//@ui {"widget":"group_start", "label":"Advanced Options", "showIf":"editAdvancedOptions"}
//@input bool printDebugStatements = false
//@input bool printWarningStatements = true
//@ui {"widget":"group_end"}

script.api.isButtonArray = script.connectButtons;
script.api.callbackOverride = script.overrideEventCallbacks;
script.api.allowNoneSelected = script.allowNone;
script.api.childButtonSelected = childButtonSelected;
script.api.childButtonCallback = childButtonCallback;

var sceneObject = script.getSceneObject();
var buttonChildren = [];
var buttonIDs = [];

function init(){
    getButtonChildren(!script.allowMultiple);
    checkButtonState();
}

var initDelay = script.createEvent("DelayedCallbackEvent");
initDelay.bind(function(eventdata){
    init();
});
initDelay.reset(0);
    
function getButtonChildren(checkMultiple){
    for(var i = 0; i < sceneObject.getChildrenCount(); i++){
        var childObj = sceneObject.getChild(i);
        var childScript = childObj.getComponent("Component.ScriptComponent");
        if(childScript && childScript.api.getButtonID){
            if(checkMultiple){
                var childID = childScript.api.getButtonID();
                if(buttonIDs.indexOf(childID) > -1){
                    printWarning("Multiple Buttons with the same ID detected: " + childID);
                }
                buttonIDs.push(childID);
            }
            buttonChildren.push(childScript);
        }
    }
}

function checkButtonState(){
    var foundButtonSelected = false;
    for(var i = 0; i < buttonChildren.length; i++){
        if(buttonChildren[i].api.isSelected()){
            foundButtonSelected = true;
        }
    }
    if(!foundButtonSelected && !script.allowNone && script.forceSelect && script.connectButtons){
        buttonChildren[0].api.select();
    }
}

function childButtonSelected(buttonID){
    if(!script.allowMultiple){
        deselectAllOther(buttonID);
    }
}

function deselectAllOther(buttonID){
    for(var i = 0; i < buttonChildren.length; i++){
        if(buttonChildren[i].api.getButtonID() != buttonID){
            buttonChildren[i].api.deselect();
        }
    }
}

function childButtonCallback(buttonID, buttonData){
    printDebug("Array callback: " + buttonID + " - data: " + buttonData);
    switch(script.callbackType){
        case 1:
            var globalFunction = global[script.onSelectGlobalFunctionName];
            if(globalFunction){
                globalFunction(buttonID, buttonData, script.onSelectGlobalFunctionData);
            }else{
                printWarning("Global Function \"" + script.onSelectGlobalFunctionName + "\" Not Defined");
            }
            break;
        case 2:
            if(script.customFunctionScript){
                var customFunction = script.customFunctionScript.api[script.onSelectFunctionName];
                if(customFunction){
                    customFunction(buttonID, buttonData, script.onSelectFunctionData);
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

// Print debug messages
function printDebug(message){
    if(script.printDebugStatements){
        print("ButtonArray " + sceneObject.name + " - " + message);
    }
}

// Print warning message
function printWarning(message){
    if(script.printWarningStatements){
        print("ButtonArray " + sceneObject.name + " - WARNING, " + message);
    }
}