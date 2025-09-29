// ToggleButton.js
// Version: 0.1.0
// Description: Trigger events by toggle.
// Author: Bennyp3333 [https://benjamin-p.dev]
//
// ----- USAGE -----
// Attach this script to a Scene Object with a Image Component.
// Button Id and Function Data are passed into custom/global functions
// Ex. otherScript.customFunction(buttonID int, onSelectFunctionData string)
//
// ----- LOCAL API USAGE -----
//
// Add callback function to select/deselect events
// script.onSelect.add(function(buttonID, data) { ... })
// script.onDeselect.add(function(buttonID, data) { ... })
//
// Remove callback function from events
// script.onSelect.remove(callbackFunction)
// script.onDeselect.remove(callbackFunction)
//
// Register with a button array (called automatically by ButtonArray)
// script.registerArray(arrayScript)
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

// ===== Event System =====
function EventDispatcher() {
	this.callbacks = [];
}

EventDispatcher.prototype.add = function(callback) {
	if (typeof callback === 'function') {
		if (this.callbacks.indexOf(callback) === -1) {
			this.callbacks.push(callback);
		}
	} else {
		printWarning("Attempted to add non-function callback");
	}
};

EventDispatcher.prototype.remove = function(callback) {
	var index = this.callbacks.indexOf(callback);
	if (index > -1) {
		this.callbacks.splice(index, 1);
	}
};

EventDispatcher.prototype.trigger = function(buttonID, data) {
	for (var i = 0; i < this.callbacks.length; i++) {
		try {
			this.callbacks[i](buttonID, data);
		} catch (e) {
			printWarning("Error in callback: " + e);
		}
	}
};

// ===== Public API =====
var onSelectEvent = new EventDispatcher();
var onDeselectEvent = new EventDispatcher();

script.onSelect = onSelectEvent;
script.onDeselect = onDeselectEvent;
script.select = select;
script.deselect = deselect;
script.setInteractable = setInteractable;
script.isSelected = isSelected;
script.getButtonID = getButtonID;
script.isInteractable = isInteractable;
script.registerArray = registerArray;

// ===== Component Setup =====
var sceneObject = script.getSceneObject();
var button = sceneObject;
var buttonTransform = button.getTransform();
var buttonImage = button.getComponent("Component.Image");
button.createComponent("Component.InteractionComponent");

var selectAudioComp = script.getSceneObject().createComponent("Component.AudioComponent");
var deselectAudioComp = script.getSceneObject().createComponent("Component.AudioComponent");

// ===== Array Management =====
var arrayScript = null;

function registerArray(array) {
	arrayScript = array;
	printDebug("Registered with ButtonArray");
}

// ===== Initialization =====
var selectDelay = script.createEvent("DelayedCallbackEvent");
selectDelay.bind(function(eventdata) {
	select();
});

function init() {
	global.touchSystem.touchBlocking = script.touchBlockingEnabled;

	if (script.activeTexture && script.inactiveTexture) {
		buttonImage.mainPass.baseTex = script.selected ? script.activeTexture : script.inactiveTexture;
	} else {
		printWarning("Active and Inactive textures are missing");
		return;
	}

	if (script.useAudio) {
		if (script.selectAudioTrack) {
			selectAudioComp.audioTrack = script.selectAudioTrack;
		}
		if (script.deselectAudioTrack) {
			deselectAudioComp.audioTrack = script.deselectAudioTrack;
		}
	}

	if (script.selectOnStart) {
		selectDelay.reset(script.delayTime);
	}
}

init();

// ===== Touch Events =====
var touchStartEvent = script.createEvent("TouchStartEvent");
touchStartEvent.enabled = script.interactable;
touchStartEvent.bind(function(eventData) {
	if (script.scaleOnPress) {
		buttonTransform.setLocalScale(vec3.one().uniformScale(script.pressedScale));
	}
});

var touchEndEvent = script.createEvent("TouchEndEvent");
touchEndEvent.enabled = script.interactable;
touchEndEvent.bind(function(eventData) {
	if (script.scaleOnPress) {
		buttonTransform.setLocalScale(vec3.one());
	}
});

var tapEvent = script.createEvent("TapEvent");
tapEvent.enabled = script.interactable;
tapEvent.bind(function(eventData) {
	if (script.selected) {
		// Check if we're in an array with restrictions
		if (arrayScript) {
			// If array doesn't allow none selected, check if we're the last one
			if (!arrayScript.allowNoneSelected()) {
				if (!arrayScript.hasOtherSelected(script.buttonID)) {
					// We're the last selected button, can't deselect
					return;
				}
			}
		}
		deselect();
	} else {
		select();
	}
});

// ===== Core Functions =====
function select() {
	if (!script.selected) {
		printDebug("Button " + script.buttonID + " Selected");
		script.selected = true;

		if (script.useAudio && selectAudioComp.audioTrack) {
			selectAudioComp.play(1);
		}

		buttonImage.mainPass.baseTex = script.activeTexture;

		// Notify array if registered
		if (arrayScript) {
			arrayScript.onChildButtonSelected(script.buttonID);
		}

		// Trigger all programmatically added callbacks
		onSelectEvent.trigger(script.buttonID, null);

		// Execute legacy callback system
		selectCallback();
	}
}

function selectCallback() {
	// If part of array with callback override, let array handle it
	if (arrayScript && arrayScript.hasCallbackOverride()) {
		var data = null;
		switch (script.callbackType) {
			case 1:
				data = script.onSelectGlobalFunctionData;
				break;
			case 2:
				data = script.onSelectFunctionData;
				break;
		}
		arrayScript.onChildButtonCallback(script.buttonID, data);
		return;
	}

	// Otherwise handle callback locally
	switch (script.callbackType) {
		case 1:
			var globalFunction = global[script.onSelectGlobalFunctionName];
			if (globalFunction) {
				globalFunction(script.buttonID, script.onSelectGlobalFunctionData);
			} else {
				printWarning("Global Function \"" + script.onSelectGlobalFunctionName + "\" Not Defined");
			}
			break;
		case 2:
			if (script.customFunctionScript) {
				var customFunction = script.customFunctionScript[script.onSelectFunctionName];
				if (customFunction) {
					customFunction(script.buttonID, script.onSelectFunctionData);
				} else {
					printWarning("Custom Function \"" + script.onSelectFunctionName + "\" Not Defined");
				}
			} else {
				printWarning("Custom Function Script Not Set");
			}
			break;
		default:
			if (script.editEventCallbacks) {
				printWarning("Select Callback Not Set");
			}
	}
}

function deselect() {
	if (script.selected) {
		printDebug("Button " + script.buttonID + " Deselected");
		script.selected = false;

		if (script.useAudio && deselectAudioComp.audioTrack) {
			deselectAudioComp.play(1);
		}

		buttonImage.mainPass.baseTex = script.inactiveTexture;

		// Trigger all programmatically added callbacks
		onDeselectEvent.trigger(script.buttonID, null);

		// Execute legacy callback system
		deselectCallback();
	}
}

function deselectCallback() {
	switch (script.callbackType) {
		case 1:
			var globalFunction = global[script.onDeselectGlobalFunctionName];
			if (globalFunction) {
				globalFunction(script.buttonID, script.onDeselectGlobalFunctionData);
			}
			break;
		case 2:
			if (script.customFunctionScript) {
				var customFunction = script.customFunctionScript[script.onDeselectFunctionName];
				if (customFunction) {
					customFunction(script.buttonID, script.onDeselectFunctionData);
				}
			} else {
				printWarning("Custom Function Script Not Set");
			}
			break;
	}
}

function setInteractable(bool) {
	script.interactable = bool;
	touchStartEvent.enabled = bool;
	touchEndEvent.enabled = bool;
	tapEvent.enabled = bool;
}

function getButtonID() {
	return script.buttonID;
}

function isSelected() {
	return script.selected;
}

function isInteractable() {
	return script.interactable;
}

// ===== Debug Functions =====
function printDebug(message) {
	if (script.printDebugStatements) {
		var newLog = "ToggleButton " + sceneObject.name + " - " + message;
		if (global.textLogger) {
			global.logToScreen(newLog);
		}
		print(newLog);
	}
}

function printWarning(message) {
	if (script.printWarningStatements) {
		var warningLog = "ToggleButton " + sceneObject.name + " - WARNING, " + message;
		if (global.textLogger) {
			global.logError(warningLog);
		}
		print(warningLog);
	}
}