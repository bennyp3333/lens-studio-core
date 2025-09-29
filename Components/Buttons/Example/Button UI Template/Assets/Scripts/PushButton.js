// PushButton.js
// Version: 0.1.0
// Description: Trigger events by press.
// Author: Bennyp3333 [https://benjamin-p.dev]
//
// ----- USAGE -----
// Attach this script to a Scene Object with a Image Component.
// Button Id and Function Data are passed into custom/global functions
// Ex. otherScript.customFunction(buttonID int, onSelectFunctionData string)
//
// ----- LOCAL API USAGE -----
//
// Add callback function to press event
// script.onPress.add(function(buttonID, data) { ... })
//
// Remove callback function from press event
// script.onPress.remove(callbackFunction)
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
//@input vec3 defaultColor = {1,1,1} {"widget":"color", "showIf":"colorOnPress"}
//@input vec3 pressedColor = {0.8,0.8,0.8} {"widget":"color", "showIf":"colorOnPress"}

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
var onPressEvent = new EventDispatcher();

script.onPress = onPressEvent;
script.press = press;
script.setInteractable = setInteractable;
script.getButtonID = getButtonID;
script.isPressed = isPressed;
script.isInteractable = isInteractable;

// ===== Component Setup =====
var sceneObject = script.getSceneObject();
var button = sceneObject;
var buttonTransform = button.getTransform();
var buttonImage = button.getComponent("Component.Image");
button.createComponent("Component.InteractionComponent");

var tapAudioComp = script.getSceneObject().createComponent("Component.AudioComponent");

// ===== Initialization =====
var pressDelay = script.createEvent("DelayedCallbackEvent");
pressDelay.bind(function(eventdata){
    press();
});

function init() {
	global.touchSystem.touchBlocking = script.touchBlockingEnabled;

	if (script.colorOnPress) {
		applyColor(script.pressed ? script.pressedColor : script.defaultColor);
	}

	if (script.useAudio) {
		tapAudioComp.audioTrack = script.tapAudioTrack;
	}

	if (script.pressOnStart) {
		pressDelay.reset(script.delayTime);
	}
}

init();

// ===== Touch Events =====
var touchStartEvent = script.createEvent("TouchStartEvent");
touchStartEvent.enabled = script.interactable;
touchStartEvent.bind(function(eventData) {
	script.pressed = true;

	if (script.colorOnPress) {
		applyColor(script.pressedColor);
	}

	if (script.scaleOnPress) {
		buttonTransform.setLocalScale(vec3.one().uniformScale(script.pressedScale));
	}
});

var touchEndEvent = script.createEvent("TouchEndEvent");
touchEndEvent.enabled = script.interactable;
touchEndEvent.bind(function(eventData) {
	script.pressed = false;

	if (script.colorOnPress) {
		applyColor(script.defaultColor);
	}

	if (script.scaleOnPress) {
		buttonTransform.setLocalScale(vec3.one());
	}
});

var tapEvent = script.createEvent("TapEvent");
tapEvent.enabled = script.interactable;
tapEvent.bind(function(eventData) {
	press();
});

// ===== Core Functions =====
function press() {
	printDebug("Button " + script.buttonID + " Pressed");

	if (script.useAudio) {
		tapAudioComp.play(1);
	}

	// Trigger all programmatically added callbacks
	onPressEvent.trigger(script.buttonID, null);

	// Execute legacy callback system
	pressCallback();
}

function pressCallback() {
	switch (script.callbackType) {
		case 1:
			var globalFunction = global[script.onPressGlobalFunctionName];
			if (globalFunction) {
				globalFunction(script.buttonID, script.onPressGlobalFunctionData);
			} else {
				printWarning("Global Function \"" + script.onPressGlobalFunctionName + "\" Not Defined");
			}
			break;
		case 2:
			if (script.customFunctionScript) {
				var customFunction = script.customFunctionScript[script.onPressFunctionName];
				if (customFunction) {
					customFunction(script.buttonID, script.onPressFunctionData);
				} else {
					printWarning("Custom Function \"" + script.onPressFunctionName + "\" Not Defined");
				}
			} else {
				printWarning("Custom Function Script Not Set");
			}
			break;
		default:
			if (script.editEventCallbacks) {
				printWarning("Press Callback Not Set");
			}
	}
}

function applyColor(color) {
	if (!buttonImage || !buttonImage.mainPass) return;

	currentAlpha = buttonImage.mainPass.baseColor.a;

	var newColor = new vec4(color.r, color.g, color.b, currentAlpha);
	buttonImage.mainPass.baseColor = newColor;
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

function isPressed() {
	return script.pressed;
}

function isInteractable() {
	return script.interactable;
}

// ===== Debug Functions =====
function printDebug(message) {
	if (script.printDebugStatements) {
		var newLog = "PushButton " + sceneObject.name + " - " + message;
		if (global.textLogger) {
			global.logToScreen(newLog);
		}
		print(newLog);
	}
}

function printWarning(message) {
	if (script.printWarningStatements) {
		var warningLog = "PushButton " + sceneObject.name + " - WARNING, " + message;
		if (global.textLogger) {
			global.logError(warningLog);
		}
		print(warningLog);
	}
}