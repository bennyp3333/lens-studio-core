// CameraSwitcher.js
// Version: 0.1.1
// Description: Manages front and back camera switching events in Lens Studio. 
//  Automatically toggles visibility of assigned objects based on active camera and triggers optional callback functions when camera switches occur.
// Author: Bennyp3333 [https://benjamin-p.dev]
//
// ----- USAGE -----
// 1. Add this script to a Scene Object
// 2. Assign objects to "Front Camera Objects" array (enabled when front camera is active)
// 3. Assign objects to "Back Camera Objects" array (enabled when back camera is active)
// 4. Optional: Enable "Event Callbacks" to trigger custom functions on camera switch
//    - Choose "Global Function" to call a function defined in global scope
//    - Choose "Custom Function" to call a function from another script component
// 5. Global variables "global.isFrontCamera" and "global.isBackCamera" are available throughout your project

//@input SceneObject[] frontCameraObjects
//@input SceneObject[] backCameraObjects

//@ui {"widget":"separator"}
//@input bool editEventCallbacks = false
//@ui {"widget":"group_start", "label":"On Front Camera", "showIf":"editEventCallbacks"}
//@input int onFrontCameraCallbackType = 0 {"label":"Callback Type", "widget":"combobox", "values":[{"label":"None", "value":0}, {"label":"Global Function", "value": 1}, {"label":"Custom Function", "value":2}]}
//@input string onFrontCameraGlobalFunctionName {"label":"Function Name", "showIf":"onFrontCameraCallbackType", "showIfValue":1}
//@input string onFrontCameraGlobalFunctionData {"label":"Function Data", "showIf":"onFrontCameraCallbackType", "showIfValue":1}
//@input Component.ScriptComponent onFrontCameraCustomFunctionScript {"label":"Custom Function Script", "showIf":"onFrontCameraCallbackType", "showIfValue":2}
//@input string onFrontCameraFunctionName {"label":"Function Name", "showIf":"onFrontCameraCallbackType", "showIfValue":2}
//@input string onFrontCameraFunctionData {"label":"Function Data", "showIf":"onFrontCameraCallbackType", "showIfValue":2}
//@ui {"widget":"group_end"}
//@ui {"widget":"group_start", "label":"On Back Camera", "showIf":"editEventCallbacks"}
//@input int onBackCameraCallbackType = 0 {"label":"Callback Type", "widget":"combobox", "values":[{"label":"None", "value":0}, {"label":"Global Function", "value": 1}, {"label":"Custom Function", "value":2}]}
//@input string onBackCameraGlobalFunctionName {"label":"Function Name", "showIf":"onBackCameraCallbackType", "showIfValue":1}
//@input string onBackCameraGlobalFunctionData {"label":"Function Data", "showIf":"onBackCameraCallbackType", "showIfValue":1}
//@input Component.ScriptComponent onBackCameraCustomFunctionScript {"label":"Custom Function Script", "showIf":"onBackCameraCallbackType", "showIfValue":2}
//@input string onBackCameraFunctionName {"label":"Function Name", "showIf":"onBackCameraCallbackType", "showIfValue":2}
//@input string onBackCameraFunctionData {"label":"Function Data", "showIf":"onBackCameraCallbackType", "showIfValue":2}
//@ui {"widget":"group_end"}

//@ui {"widget":"separator"}
//@input bool editAdvancedOptions
//@ui {"widget":"group_start", "label":"Advanced Options", "showIf":"editAdvancedOptions"}
//@input bool printDebugStatements = false
//@input bool printWarningStatements = true
//@ui {"widget":"group_end"}

var sceneObject = script.getSceneObject();

global.isFrontCamera = false;
global.isBackCamera = false;

function onFrontCamera(){
    printDebug("Switched to Front Camera!");

    global.isFrontCamera = true;
    global.isBackCamera = false;

    for (var i = 0; i < script.backCameraObjects.length; i++) {
        if (script.backCameraObjects[i]) {
            script.backCameraObjects[i].enabled = false;
        } else {
            printWarning("Back Camera Object at index " + i + " is null or undefined, skipping");
        }
    }
    for (var i = 0; i < script.frontCameraObjects.length; i++) {
        if (script.frontCameraObjects[i]) {
            script.frontCameraObjects[i].enabled = true;
        } else {
            printWarning("Front Camera Object at index " + i + " is null or undefined, skipping");
        }
    }

    frontCameraCallback();
}

function onBackCamera(){
    printDebug("Switched to Back Camera!");

    global.isFrontCamera = false;
    global.isBackCamera = true;

    for (var i = 0; i < script.backCameraObjects.length; i++) {
        if (script.backCameraObjects[i]) {
            script.backCameraObjects[i].enabled = true;
        } else {
            printWarning("Back Camera Object at index " + i + " is null or undefined, skipping");
        }
    }
    for (var i = 0; i < script.frontCameraObjects.length; i++) {
        if (script.frontCameraObjects[i]) {
            script.frontCameraObjects[i].enabled = false;
        } else {
            printWarning("Front Camera Object at index " + i + " is null or undefined, skipping");
        }
    }

    backCameraCallback();
}

function frontCameraCallback() {
    switch (script.onFrontCameraCallbackType) {
        case 1:
            var globalFunction = global[script.onFrontCameraGlobalFunctionName];
            if (globalFunction) {
                globalFunction(script.onFrontCameraGlobalFunctionData);
            } else {
                printWarning("Global Function \"" + script.onFrontCameraGlobalFunctionName + "\" Not Defined");
            }
            break;
        case 2:
            if (script.onFrontCameraCustomFunctionScript) {
                var customFunction = script.onFrontCameraCustomFunctionScript[script.onFrontCameraFunctionName];
                if (customFunction) {
                    customFunction(script.onFrontCameraFunctionData);
                } else {
                    printWarning("Custom Function \"" + script.onFrontCameraFunctionName + "\" Not Defined");
                }
            } else {
                printWarning("Custom Function Script Not Set");
            }
            break;
        default:
            if (script.eventCallbacks) {
                printWarning("Front Camera Callback Not Set");
            }
    }
}

function backCameraCallback() {
    switch (script.onBackCameraCallbackType) {
        case 1:
            var globalFunction = global[script.onBackCameraGlobalFunctionName];
            if (globalFunction) {
                globalFunction(script.onBackCameraGlobalFunctionData);
            } else {
                printWarning("Global Function \"" + script.onBackCameraGlobalFunctionName + "\" Not Defined");
            }
            break;
        case 2:
            if (script.onBackCameraCustomFunctionScript) {
                var customFunction = script.onBackCameraCustomFunctionScript[script.onBackCameraFunctionName];
                if (customFunction) {
                    customFunction(script.onBackCameraFunctionData);
                } else {
                    printWarning("Custom Function \"" + script.onBackCameraFunctionName + "\" Not Defined");
                }
            } else {
                printWarning("Custom Function Script Not Set");
            }
            break;
        default:
            if (script.eventCallbacks) {
                printWarning("Back Camera Callback Not Set");
            }
    }
}

script.createEvent("CameraFrontEvent").bind(onFrontCamera);
script.createEvent("CameraBackEvent").bind(onBackCamera);

// ===== Debug Functions =====
function printDebug(message) {
	if (script.printDebugStatements) {
		var newLog = "CameraSwitcher " + sceneObject.name + " - " + message;
		if (global.textLogger) {
			global.logToScreen(newLog);
		}
		print(newLog);
	}
}

function printWarning(message) {
	if (script.printWarningStatements) {
		var warningLog = "CameraSwitcher " + sceneObject.name + " - WARNING, " + message;
		if (global.textLogger) {
			global.logError(warningLog);
		}
		print(warningLog);
	}
}