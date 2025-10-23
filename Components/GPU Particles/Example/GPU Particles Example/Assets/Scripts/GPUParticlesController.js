// GPUParticlesController.js
// Version: 0.1.0
// Description: Handles start/stop/pause/reset operations for GPU particles.
// Author: Bennyp3333 [https://benjamin-p.dev]
//
// ----- USAGE -----
// Place this script on any SceneObject with a MeshVisual component using GPU particles material
//
// ----- LOCAL API USAGE -----
// script.start() - Start particles immediately
// script.start(delayOn) - Start particles after delayOn seconds
// script.start(delayOn, delayOff) - Start after delayOn seconds, auto-stop after delayOff seconds
// script.stop() - Stop particles
// script.reset() - Reset particles (stop and prepare for fresh start)
// script.toggle() - Toggle particles (start if stopped, stop if running)


//@input bool startOnInit = true
//@input bool useUniqueSeeds = true {"hint": "Generate unique seeds on each start"}
//@ui {"widget":"separator"}
//@input bool overrideParticleCount = false {"hint": "Override the material's particle count"}
//@input int particleCount = 1000 {"showIf": "overrideParticleCount", "hint": "Number of particles to render"}
//@ui {"widget":"separator"}
//@input bool editAdvancedOptions
//@ui {"widget":"group_start", "label":"Advanced Options", "showIf":"editAdvancedOptions"}
//@input bool printDebugStatements = false
//@input bool printWarningStatements = true
//@ui {"widget":"group_end"}

var sceneObject = script.getSceneObject();

var particlesMat = null;
var particleTimeOffset = 0;
var meshVisual = null;

var updateParticlesEvent = null;
var startParticlesDelay = null;
var stopParticlesDelay = null;

var isRunning = false;

function init() {
	// Get the mesh visual component
	meshVisual = sceneObject.getComponent("Component.RenderMeshVisual");
	if (!meshVisual) {
		printWarning("No MeshVisual component found!");
		return;
	}
	meshVisual.enabled = false;

	// Get the material
	var material = meshVisual.getMaterial(0);
	if (!material) {
		printWarning("No material found!");
		return;
	}

	// Make material unique
	particlesMat = makeMatUnique(meshVisual);

	// Override particle count if specified
	if (script.overrideParticleCount && particlesMat.mainPass) {
		particlesMat.mainPass.instanceCount = script.particleCount;
		printDebug("Particle count set to: " + script.particleCount);
	}

	// Create update event
	updateParticlesEvent = script.createEvent("UpdateEvent");
	updateParticlesEvent.enabled = false;
	updateParticlesEvent.bind(function(eventData) {
		printDebug("Updating particles time");
		if (particlesMat && particlesMat.mainPass) {
			particlesMat.mainPass.externalTimeInput = getTime() - particleTimeOffset;
		}
	});

	if (script.startOnInit) {
		start();
	}

	printDebug("Initialized!");
}

function start(delayOn, delayOff) {
	// Default parameters to 0
	delayOn = delayOn || 0;
	delayOff = delayOff || 0;

	if (!particlesMat) {
		printWarning("Material not initialized!");
		return;
	}

	if (delayOn > 0) {
		printDebug("Starting particles with " + delayOn + "s delay");

		startParticlesDelay = script.createEvent("DelayedCallbackEvent");
		startParticlesDelay.bind(function() {
			startImmediate(delayOff);
		});
		startParticlesDelay.reset(delayOn);
	} else {
		startImmediate(delayOff);
	}
}

function startImmediate(delayOff) {
	printDebug("Starting particles");

	// Reset time and set seed
	particlesMat.mainPass.externalTimeInput = 0;
	if (script.useUniqueSeeds) {
		particlesMat.mainPass.externalSeed = Math.random();
	}

	// Set time offset and enable
	particleTimeOffset = getTime();
	meshVisual.enabled = true;
	updateParticlesEvent.enabled = true;
	isRunning = true;

	// Setup auto-stop if delayOff is specified
	if (delayOff > 0) {
		printDebug("Auto-stop scheduled for " + delayOff + "s");
		stopParticlesDelay = script.createEvent("DelayedCallbackEvent");
		stopParticlesDelay.bind(function() {
			stop();
		});
		stopParticlesDelay.reset(delayOff);
	}
}

function stop() {
	printDebug("Stopping particles");

	if (updateParticlesEvent){ updateParticlesEvent.enabled = false; }
	if (meshVisual){ meshVisual.enabled = false; }
	isRunning = false;

	// Clear any pending delayed events
	clearDelayedEvents();
}

function reset() {
	printDebug("Resetting particles");

	stop();
	if (particlesMat && particlesMat.mainPass) {
		particlesMat.mainPass.externalTimeInput = 0;
	}
}

function toggle() {
	if (isRunning) {
		stop();
	} else {
		start();
	}
}

function clearDelayedEvents() {
	// Clear any pending delayed callbacks
	if (startParticlesDelay) {
		startParticlesDelay.enabled = false;
		startParticlesDelay = null;
	}
	if (stopParticlesDelay) {
		stopParticlesDelay.enabled = false;
		stopParticlesDelay = null;
	}
}

// Public API
script.start = start;
script.stop = stop;
script.reset = reset;
script.toggle = toggle;

// Additional getters for state checking
script.isRunning = function() {
	return isRunning;
};

script.createEvent("OnStartEvent").bind(init);

// Helpers
function makeMatUnique(meshVis) {
	var clonedMaterial = meshVis.getMaterial(0).clone();
	meshVis.clearMaterials();
	meshVis.addMaterial(clonedMaterial);
	return clonedMaterial;
}

// Debug
function printDebug(message) {
	if (script.printDebugStatements) {
		var newLog = "GPUParticlesController " + sceneObject.name + " - " + message;
		if (global.textLogger) {
			global.logToScreen(newLog);
		}
		print(newLog);
	}
}

function printWarning(message) {
	if (script.printWarningStatements) {
		var warningLog = "GPUParticlesController " + sceneObject.name + " - WARNING: " + message;
		if (global.textLogger) {
			global.logError(warningLog);
		}
		print(warningLog);
	}
}