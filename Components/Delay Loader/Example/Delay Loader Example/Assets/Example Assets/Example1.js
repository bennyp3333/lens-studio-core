//@input Component.Text numberText
/*
METHOD 1 - MANUAL (for scripts you can edit)

The Text this script needs now lives inside the "Heavy Object 1" prefab, so the input above is
left empty in the Inspector. The PrefabForwarder on the prefab root forwards it under the Forward
Name "numberText", and this script fills its own input once DelayLoader has loaded the Load Name
"object1".

Until then the input is empty, so anything that uses it waits on the ready flag.

onLoaded is sticky, if object1 loaded before this script subscribed the callback still fires
straight away, so script order does not matter.
*/

var ready = false;

function init() {
    global.delayLoader.onLoaded("object1").add(function(loaded) {
        // loaded.root is the instantiated prefab, use it like any other SceneObject
        loaded.root.getTransform().setLocalPosition(new vec3(0, 0, 0));

        // restore the input from the forwarded reference, then open the gate
        script.numberText = loaded.get("numberText");
        ready = true;

        print("[Example Script 1] Loaded Object 1");
        printNumber();
    });
}

function onUpdate() {
    // the gate, skip anything that touches forwarded references until they have arrived
    if (!ready) return;

    // ... per-frame logic that uses script.numberText goes here ...
}

function printNumber() {
    print("[Example Script 1] Number is: " + script.numberText.text);
}

script.createEvent("OnStartEvent").bind(init);
script.createEvent("UpdateEvent").bind(onUpdate);
