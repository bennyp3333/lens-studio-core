/*
GlobalUtils.js
Version: 1.1.0
Description: Consolidates utility functions from multiple utility modules into a single global.utils object.
Author: Bennyp3333 [https://benjamin-p.dev]

Usage:
  Access all loaded utility functions via global.utils after Core initializes:
    global.utils.lerp(a, b, t)
    global.utils.clamp(val, min, max)
    global.utils.randomRange(min, max)
    // ... etc.

Advanced Options:
  Enable the "Advanced Options" toggle in the inspector to reveal per-module
  toggles. Each utility module can be individually disabled to skip loading it
  at startup. All modules are enabled by default — only disable ones you are
  certain your project does not use.
*/

//@input bool advancedOptions = false {"label":"Advanced Options"}
//@ui {"widget":"group_start", "label":"Utility Modules", "showIf":"advancedOptions"}
//@input bool loadArrayUtils = true {"label":"Array Utils"}
//@input bool loadAsyncUtils = true {"label":"Async Utils"}
//@input bool loadColorUtils = true {"label":"Color Utils"}
//@input bool loadComponentUtils = true {"label":"Component Utils"}
//@input bool loadMathUtils = true {"label":"Math Utils"}
//@input bool loadObjectUtils = true {"label":"Object Utils"}
//@input bool loadRandomUtils = true {"label":"Random Utils"}
//@input bool loadSceneUtils = true {"label":"Scene Utils"}
//@input bool loadScreenUtils = true {"label":"Screen Utils"}
//@input bool loadStringUtils = true {"label":"String Utils"}
//@ui {"widget":"group_end"}

function tryRequire(file){
    try {
      return require(file);
    } catch (error) {
      print('Error loading module:' + error);
    }
}

var utilModules = [];
if (script.loadArrayUtils)     utilModules.push(tryRequire("../Utilities/ArrayUtils.js"));
if (script.loadAsyncUtils)     utilModules.push(tryRequire("../Utilities/AsyncUtils.js"));
if (script.loadColorUtils)     utilModules.push(tryRequire("../Utilities/ColorUtils.js"));
if (script.loadComponentUtils) utilModules.push(tryRequire("../Utilities/ComponentUtils.js"));
if (script.loadMathUtils)      utilModules.push(tryRequire("../Utilities/MathUtils.js"));
if (script.loadObjectUtils)    utilModules.push(tryRequire("../Utilities/ObjectUtils.js"));
if (script.loadRandomUtils)    utilModules.push(tryRequire("../Utilities/RandomUtils.js"));
if (script.loadSceneUtils)     utilModules.push(tryRequire("../Utilities/SceneUtils.js"));
if (script.loadScreenUtils)    utilModules.push(tryRequire("../Utilities/ScreenUtils.js"));
if (script.loadStringUtils)    utilModules.push(tryRequire("../Utilities/StringUtils.js"));

function consolidateUtils() {
    const consolidatedUtils = {};
    
    // get utility functions from required modules
    for(var i = 0; i < utilModules.length; i++){
        mergeWithConflictDetection(utilModules[i], consolidatedUtils);
    }
    
    // get utility functions from all scripts on this sceneobject
    const scripts = script.getSceneObject().getComponents("Component.ScriptComponent");
    for (var scriptKey in scripts) {
        const scriptComp = scripts[scriptKey];
        if (!scriptComp.isSame(script)) {
            const utils = scriptComp.exports;
            mergeWithConflictDetection(utils, consolidatedUtils);
        }
    }
    
    return consolidatedUtils;
}

function mergeWithConflictDetection(fromObj, toObj) {
    for (const funcName in fromObj) {
        if (funcName in toObj) {
            print("Conflict detected for function name: " + funcName);
        } else {
            toObj[funcName] = fromObj[funcName];
            //print("Loaded util: " + funcName);
        }
    }
}

script.globalUtils = consolidateUtils();

global.utils = script.globalUtils;