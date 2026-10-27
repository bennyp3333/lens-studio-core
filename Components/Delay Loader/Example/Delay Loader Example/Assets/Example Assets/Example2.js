//@input SceneObject numberObj
/*
METHOD 2 - PREFAB INJECTOR (for scripts you can't or don't want to edit)

Nothing in this script knows about delay loading. It is written exactly as it was before the
"Number" object moved into the "Heavy Object 2" prefab.

The wiring lives in the scene instead:
 - This script component is unticked in the Inspector, so it does not run at lens start.
 - The PrefabForwarder on the prefab root forwards the Number object under the Forward Name
   "number".
 - The PrefabInjector on the "Prefab Injector" object has Load Name "object2" and one row,
   Forward Name "number" -> Target Input "numberObj". Once DelayLoader loads "object2" it writes
   the Number object into this script's numberObj input, then enables this component.

So this script starts up for the first time with numberObj already filled in, and reads it
exactly as it normally would.
*/

var numberText = null;

function init() {
    numberText = script.numberObj.getComponent("Component.Text");
    print("[Example Script 2] Script enabled after Object 2 loaded in");
    printNumber();
}

function printNumber() {
    print("[Example Script 2] Number is: " + numberText.text);
}

script.createEvent("OnStartEvent").bind(init);
