//@input SceneObject camera
//@input bool onUpdate
//@input bool onStart
//@ui {"widget":"separator"}
//@input bool debug
//@input string debugName = "Billboard" {"showIf":"debug"}
//@input Component.Text debugText {"showIf":"debug"}

var self = script.getSceneObject();
var selfTransform = self.getTransform();

var cameraTransform = null;

var cameraPos = new vec3(0, 0, 0);
var selfPos = new vec3(0, 0, 0);

function init(){
    if(!script.camera){
        if(global.MainCamera){
            script.camera = global.MainCamera;
        }else{
            script.camera = findCamera();
        }
    }
    
    cameraTransform = script.camera.getTransform();
    
    updateEvent.enabled = script.onUpdate;
    if(script.onStart){ script.billboard(); }
    
    debugPrint("Initilized!");
}

script.billboard = function(){
    cameraPos = cameraTransform.getWorldPosition();
    selfPos = selfTransform.getWorldPosition();
    
    var diffVec = cameraPos.sub(selfPos);
    diffVec.y = 0;
    
    var lookQuat = quat.lookAt(diffVec, new vec3(0, 1, 0));
    selfTransform.setWorldRotation(lookQuat);
    
    //var debugAngle = radToDeg(lookQuat.getAngle()).toFixed(0);
    //debugPrint("Rotation set: " + debugAngle + "°");
}

var updateEvent = script.createEvent("UpdateEvent");
updateEvent.enabled = false;
updateEvent.bind(script.billboard);

function findCamera(){
    for(var i = 0; i < global.scene.getRootObjectsCount(); i++){
        var object = global.scene.getRootObject(i);
        if(object.getComponents("Component.Camera").length > 0){
            debugPrint("Found camera: " + object);
            return object;
        }
    }
}

function radToDeg(radians){
    return radians * (180/Math.PI);
}

script.createEvent("OnStartEvent").bind(init);

// Debug
function debugPrint(text){
    if(script.debug){
        var newLog = script.debugName + ": " + text;
        if(global.textLogger){ global.logToScreen(newLog); }
        if(script.debugText){ script.debugText.text = newLog; }
        print(newLog);
    }
}

function errorPrint(text){
    var errorLog = "!!ERROR!! " + script.debugName + ": " + text;
    if(global.textLogger){ global.logError(errorLog); }
    if(script.debugText){ script.debugText.text = errorLog; }
    print(errorLog);
}