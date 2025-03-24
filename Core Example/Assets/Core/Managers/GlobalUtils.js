function tryRequire(file){
    try {
      return require(file);
    } catch (error) {
      print('Error loading module:' + error);
    }
}

var utilModules = [
    tryRequire("../Utilities/ArrayUtils.js"),
    tryRequire("../Utilities/ColorUtils.js"),
    tryRequire("../Utilities/ComponentUtils.js"),
    tryRequire("../Utilities/MathUtils.js"),
    tryRequire("../Utilities/ObjectUtils.js"),
    tryRequire("../Utilities/RandomUtils.js"),
    tryRequire("../Utilities/SceneUtils.js"),
    tryRequire("../Utilities/StringUtils.js")
]

function consolidateUtils() {
    const consolidatedUtils = {};
    
    // get utility functions from required modules
    for(var i = 0; i < utilModules.length; i++){
        mergeWithConflictDetection(utilModules[i], consolidatedUtils);
    }
    
    // get utility functions from all scripts on this sceneobject
    const scripts = script.getSceneObject().getComponents("Component.ScriptComponent");
    for (scriptKey in scripts) {
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