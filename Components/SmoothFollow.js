//@input boolean enabled = true
//@input SceneObject attachTo
//@input bool smoothPosition = true
//@input float posSmoothing = 1.0 {"showIf":"smoothPosition"}
//@input bool smoothRotation = false
//@input float rotSmoothing = 1.0 {"showIf":"smoothRotation"}

script.objectTransform = script.getSceneObject().getTransform();
script.attachToTransform = script.attachTo.getTransform();

//TODO: add option to not affect position or rotation

function init() {
    script.objectTransform.setWorldPosition(script.attachToTransform.getWorldPosition());
    script.objectTransform.setWorldRotation(script.attachToTransform.getWorldRotation());
}

script.start = function(reset) {
    updateEvent.enabled = true;
    if(reset){ script.reset(); }
}

script.stop = function() {
    updateEvent.enabled = false;
}

script.reset = function() {
    init();
}

script.updateAttachment = function(object) {
    print("" + script.getSceneObject().name + " Re-attach: " + object.name);
    script.attachTo = object;
    script.attachToTransform = script.attachTo.getTransform();
}

var updateEvent = script.createEvent("UpdateEvent");
updateEvent.enabled = script.enabled;
updateEvent.bind(function(eventData) {
    // Handle position updates
    if (script.smoothPosition) {
        var currentPosition = script.objectTransform.getWorldPosition();
        var targetPosition = script.attachToTransform.getWorldPosition();
        var lerpedPosition = vec3.lerp(currentPosition, targetPosition, script.posSmoothing * getDeltaTime());
        script.objectTransform.setWorldPosition(lerpedPosition);
    } else {
        script.objectTransform.setWorldPosition(script.attachToTransform.getWorldPosition());
    }

    // Handle rotation updates
    if (script.smoothRotation) {
        var currentRotation = script.objectTransform.getWorldRotation();
        var targetRotation = script.attachToTransform.getWorldRotation();
        var lerpedRotation = quat.slerp(currentRotation, targetRotation, script.rotSmoothing * getDeltaTime());
        script.objectTransform.setWorldRotation(lerpedRotation);
    } else {
        //script.objectTransform.setWorldRotation(script.attachToTransform.getWorldRotation());
    }
});

script.createEvent("OnStartEvent").bind(init);