// GPUParticlesController.js
// Version: 1.0.0
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
//
// ----- GLOBAL API USAGE -----
// global.GPUParticles.start("name")               - Start by name (or SceneObject ref)
// global.GPUParticles.start("name", 0.5, 2.0)     - Start with delays
// global.GPUParticles.stop("name")                 - Stop by name
// global.GPUParticles.reset("name")                - Reset by name
// global.GPUParticles.toggle("name")               - Toggle by name
// global.GPUParticles.isRunning("name")            - Returns bool (or array if multiple match)


// ---- GPUParticlesManager ----
// Lightweight global registry — instantiated once, shared across all controllers.
var GPUParticlesManager = function() {
    this._registry = {};
};

GPUParticlesManager.prototype._resolve = function(identifier) {
    if (typeof identifier === "string") {
        return this._registry[identifier] || [];
    }
    var results = [];
    for (var name in this._registry) {
        var list = this._registry[name];
        for (var i = 0; i < list.length; i++) {
            if (list[i].getSceneObject().isSame(identifier)) results.push(list[i]);
        }
    }
    return results;
};

GPUParticlesManager.prototype._exec = function(method, identifier, a, b) {
    var targets = this._resolve(identifier);
    for (var i = 0; i < targets.length; i++) targets[i][method](a, b);
};

GPUParticlesManager.prototype.start  = function(id, delayOn, delayOff) { this._exec("start",  id, delayOn, delayOff); };
GPUParticlesManager.prototype.stop   = function(id) { this._exec("stop",   id); };
GPUParticlesManager.prototype.reset  = function(id) { this._exec("reset",  id); };
GPUParticlesManager.prototype.toggle = function(id) { this._exec("toggle", id); };

GPUParticlesManager.prototype.isRunning = function(identifier) {
    var targets = this._resolve(identifier);
    if (targets.length === 0) return false;
    if (targets.length === 1) return targets[0].isRunning();
    return targets.map(function(t) { return t.isRunning(); });
};

GPUParticlesManager.prototype._add = function(name, controller) {
    if (!this._registry[name]) this._registry[name] = [];
    this._registry[name].push(controller);
};

GPUParticlesManager.prototype._remove = function(name, controller) {
    var list = this._registry[name];
    if (!list) return;
    var idx = list.indexOf(controller);
    if (idx !== -1) list.splice(idx, 1);
    if (list.length === 0) delete this._registry[name];
};
// ---- end GPUParticlesManager ----


//@input bool startOnInit = true
//@input bool useUniqueSeeds = true {"hint": "Generate unique seeds on each start"}
//@input bool makeUniqueMaterial = true {"hint": "Clone material to avoid affecting other objects using it"}
//@ui {"widget":"separator"}
//@input bool overrideParticleCount = false {"hint": "Override the material's particle count"}
//@input int particleCount = 1000 {"showIf": "overrideParticleCount", "hint": "Number of particles to render"}
//@ui {"widget":"separator"}
//@input bool editAdvancedOptions
//@ui {"widget":"group_start", "label":"Advanced Options", "showIf":"editAdvancedOptions"}
//@input string particleName {"hint":"Global registry name — defaults to SceneObject name"}
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

	// Make material unique if enabled, otherwise use shared material
	if (script.makeUniqueMaterial) {
		particlesMat = makeMatUnique(meshVisual);
	} else {
		particlesMat = material;
	}

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

	// Register with global manager
	var _regName = script.particleName || sceneObject.name;
	if (!global.GPUParticles) global.GPUParticles = new GPUParticlesManager();
	global.GPUParticles._add(_regName, script);
	script.createEvent("OnDestroyEvent").bind(function() {
		global.GPUParticles._remove(_regName, script);
	});

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

init();

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