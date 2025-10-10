// EnableOnStart.js
// Version: 0.1.0
// Description: Enables assigned Scene Objects when the lens starts.
//  Useful for keeping objects disabled in the Scene view to reduce visual clutter while ensuring they activate at runtime.
// Author: Bennyp3333 [https://benjamin-p.dev]
//
// ----- USAGE -----
// 1. Add this script to a Scene Object
// 2. Assign objects to the "Objects To Enable" array
// 3. Keep those objects disabled in the Scene view for cleaner editing
// 4. Objects will automatically enable when the lens runs

//@input SceneObject[] objectsToEnable

function onAwake(){
    script.objectsToEnable.forEach(object => {
        object.enabled = true;
    });
}

script.createEvent("OnStartEvent").bind(onAwake);