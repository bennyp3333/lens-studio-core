
//@ui {"widget":"separator"}
//@input bool debug
//@input string debugName = "" {"showIf":"debug"}
//@input Component.Text debugText {"showIf":"debug"}

global.BaseTools(script);

var self = script.getSceneObject();
var selfTransform = self.getTransform();

function init() {
    // Example: delayed action
    // script.delay(1.0, function() {
    //     debugPrint("1 second later!");
    // });

    debugPrint("Initialized!");
}

function onUpdate(){

    //debugPrint("Updated!");
}

script.createEvent("OnStartEvent").bind(init);
script.createEvent("UpdateEvent").bind(onUpdate);

// Debug
function debugPrint(text, force) {
    if (!force && !script.debug) return;
    var newLog = (script.debugName || self.name) + ": " + text;
    if(global.textLogger) global.logToScreen(newLog);
    if(script.debugText) script.debugText.text = newLog;
    print(newLog);
}