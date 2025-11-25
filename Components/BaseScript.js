
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
    //     script.debugPrint("1 second later!");
    // });

    script.debugPrint("Initialized!");
}

function onUpdate(){

    //debugPrint("Updated!");
}

script.createEvent("OnStartEvent").bind(init);
script.createEvent("UpdateEvent").bind(onUpdate);