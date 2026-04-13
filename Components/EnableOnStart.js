// EnableOnStart.js
// Version: 1.0.0
// Description: Enables assigned Scene Objects when the lens starts.
//  Useful for keeping objects disabled in the Scene view to reduce visual clutter while ensuring they activate at runtime.
//  Also helps with startup performance by deferring the initialization of heavy objects (complex meshes, particle systems, etc.)
//  until after the lens has loaded.
// Author: Bennyp3333 [https://benjamin-p.dev]
//
// ----- USAGE -----
// 1. Add this script to a Scene Object
// 2. Assign objects to the "Objects To Enable" array
// 3. Keep those objects disabled in the Scene view for cleaner editing
// 4. Objects will automatically enable when the lens runs
// 5. For heavy objects, set a delay > 0 to improve startup performance
//    Note: A delay is recommended for performance-intensive objects to avoid blocking the initial load

//@input SceneObject[] objectsToEnable
//@input Component[] componentsToEnable
//@input float delay = 0

function onAwake(){
    if(script.delay <= 0){
        enable();
    }else{
        var delayEnable = script.createEvent("DelayedCallbackEvent");
        delayEnable.bind(enable);
        delayEnable.reset(script.delay);
    }
}

function enable(){
    script.objectsToEnable.forEach(object => {
        object.enabled = true;
    });
    script.componentsToEnable.forEach(component => {
        component.enabled = true;
    });
}

script.createEvent("OnStartEvent").bind(onAwake);