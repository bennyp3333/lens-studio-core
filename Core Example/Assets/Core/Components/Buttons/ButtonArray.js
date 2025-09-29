// ButtonArray.js
// Version: 0.1.0
// Description: Controls array of Toggle Buttons.
// Author: Bennyp3333 [https://benjamin-p.dev]
//
// ----- USAGE -----
// Attach this script to a Scene Object that is parented to Toggle Buttons.
// Button Id, Button Data and Function Data are passed into custom/global functions
// Ex. otherScript.customFunction(buttonID int, buttonData string, onSelectFunctionData string)
//
// ----- LOCAL API USAGE -----
//
// Add callback function to select event
// script.onSelect.add(function(buttonID, buttonData, arrayData) { ... })
//
// Remove callback function from event
// script.onSelect.remove(callbackFunction)
//
// Returns array of all button scripts
// script.getButtons()
//
// Returns button script by ID (or null if not found)
// script.getButtonByID(buttonID)
//
// Returns currently selected button(s)
// script.getSelectedButtons() // returns array
// script.getSelectedButton() // returns first selected or null
//
// Select a button by ID
// script.selectButtonByID(buttonID)
//
// Deselect a button by ID
// script.deselectButtonByID(buttonID)
//
// Called by child buttons (internal use)
// script.onChildButtonSelected(buttonID)
// script.onChildButtonCallback(buttonID, buttonData)
// script.hasCallbackOverride()
// script.allowNoneSelected()
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

EventDispatcher.prototype.trigger = function(buttonID, buttonData, arrayData) {
	for (var i = 0; i < this.callbacks.length; i++) {
		try {
			this.callbacks[i](buttonID, buttonData, arrayData);
		} catch (e) {
			printWarning("Error in callback: " + e);
		}
	}
};

// ===== Public API =====
var onSelectEvent = new EventDispatcher();

script.onSelect = onSelectEvent;
script.getButtons = getButtons;
script.getButtonByID = getButtonByID;
script.getSelectedButtons = getSelectedButtons;
script.getSelectedButton = getSelectedButton;
script.selectButtonByID = selectButtonByID;
script.deselectButtonByID = deselectButtonByID;

// Internal API for child buttons
script.onChildButtonSelected = onChildButtonSelected;
script.onChildButtonCallback = onChildButtonCallback;
script.hasCallbackOverride = hasCallbackOverride;
script.allowNoneSelected = allowNoneSelected;
script.allowMultipleSelected = allowMultipleSelected;
script.hasOtherSelected = hasOtherSelected;

// ===== State =====
var sceneObject = script.getSceneObject();
var buttonChildren = [];
var buttonMap = {}; // Map buttonID to script for fast lookup

// ===== Initialization =====
function init() {
	findAndRegisterButtons();
	checkInitialButtonState();
}

var initDelay = script.createEvent("DelayedCallbackEvent");
initDelay.bind(function(eventdata) {
	init();
});
initDelay.reset(0);

function findAndRegisterButtons() {
	buttonChildren = [];
	buttonMap = {};
	var seenIDs = [];

	for (var i = 0; i < sceneObject.getChildrenCount(); i++) {
		var childObj = sceneObject.getChild(i);
		var childScript = childObj.getComponent("Component.ScriptComponent");

		if (childScript && childScript.getButtonID) {
			var childID = childScript.getButtonID();

			// Check for duplicate IDs
			if (seenIDs.indexOf(childID) > -1) {
				printWarning("Multiple Buttons with the same ID detected: " + childID);
			}
			seenIDs.push(childID);

			// Register button
			buttonChildren.push(childScript);
			buttonMap[childID] = childScript;

			// Register this array with the button
			if (script.connectButtons && childScript.registerArray) {
				childScript.registerArray(script);
			}

			printDebug("Registered button ID: " + childID);
		}
	}

	printDebug("Found " + buttonChildren.length + " buttons");
}

function checkInitialButtonState() {
	if (!script.connectButtons) return;

	var hasSelected = false;
	for (var i = 0; i < buttonChildren.length; i++) {
		if (buttonChildren[i].isSelected()) {
			hasSelected = true;
			break;
		}
	}

	if (!hasSelected && !script.allowNone && script.forceSelect && buttonChildren.length > 0) {
		printDebug("No button selected, forcing first button");
		buttonChildren[0].select();
	}
}

// ===== Child Button Handlers =====
function onChildButtonSelected(buttonID) {
	printDebug("Child button selected: " + buttonID);

	if (!script.connectButtons) return;

	if (!script.allowMultiple) {
		deselectAllExcept(buttonID);
	}
}

function onChildButtonCallback(buttonID, buttonData) {
	printDebug("Child callback: " + buttonID + " - data: " + buttonData);

	// Trigger programmatically added callbacks
	onSelectEvent.trigger(buttonID, buttonData, null);

	// Execute legacy callback system
	executeLegacyCallback(buttonID, buttonData);
}

// ===== Button Management =====
function deselectAllExcept(buttonID) {
	for (var i = 0; i < buttonChildren.length; i++) {
		if (buttonChildren[i].getButtonID() !== buttonID) {
			buttonChildren[i].deselect();
		}
	}
}

function getButtons() {
	return buttonChildren;
}

function getButtonByID(buttonID) {
	return buttonMap[buttonID] || null;
}

function getSelectedButtons() {
	var selected = [];
	for (var i = 0; i < buttonChildren.length; i++) {
		if (buttonChildren[i].isSelected()) {
			selected.push(buttonChildren[i]);
		}
	}
	return selected;
}

function getSelectedButton() {
	var selected = getSelectedButtons();
	return selected.length > 0 ? selected[0] : null;
}

function selectButtonByID(buttonID) {
	var button = getButtonByID(buttonID);
	if (button) {
		button.select();
	} else {
		printWarning("Button with ID " + buttonID + " not found");
	}
}

function deselectButtonByID(buttonID) {
	var button = getButtonByID(buttonID);
	if (button) {
		button.deselect();
	} else {
		printWarning("Button with ID " + buttonID + " not found");
	}
}

// ===== Configuration Getters =====
function hasCallbackOverride() {
	return script.overrideEventCallbacks;
}

function allowNoneSelected() {
	return script.allowNone;
}

function allowMultipleSelected() {
	return script.allowMultiple;
}

function hasOtherSelected(excludeButtonID) {
	for (var i = 0; i < buttonChildren.length; i++) {
		if (buttonChildren[i].getButtonID() !== excludeButtonID && buttonChildren[i].isSelected()) {
			return true;
		}
	}
	return false;
}

// ===== Legacy Callback System =====
function executeLegacyCallback(buttonID, buttonData) {
	switch (script.callbackType) {
		case 1:
			var globalFunction = global[script.onSelectGlobalFunctionName];
			if (globalFunction) {
				globalFunction(buttonID, buttonData, script.onSelectGlobalFunctionData);
			} else {
				printWarning("Global Function \"" + script.onSelectGlobalFunctionName + "\" Not Defined");
			}
			break;
		case 2:
			if (script.customFunctionScript) {
				var customFunction = script.customFunctionScript[script.onSelectFunctionName];
				if (customFunction) {
					customFunction(buttonID, buttonData, script.onSelectFunctionData);
				} else {
					printWarning("Custom Function \"" + script.onSelectFunctionName + "\" Not Defined");
				}
			} else {
				printWarning("Custom Function Script Not Set");
			}
			break;
		default:
			if (script.overrideEventCallbacks) {
				printWarning("Select Callback Not Set");
			}
	}
}

// ===== Debug Functions =====
function printDebug(message) {
	if (script.printDebugStatements) {
		var newLog = "ButtonArray " + sceneObject.name + " - " + message;
		if (global.textLogger) {
			global.logToScreen(newLog);
		}
		print(newLog);
	}
}

function printWarning(message) {
	if (script.printWarningStatements) {
		var warningLog = "ButtonArray " + sceneObject.name + " - WARNING, " + message;
		if (global.textLogger) {
			global.logError(warningLog);
		}
		print(warningLog);
	}
}