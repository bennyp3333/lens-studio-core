//@input SceneObject target
//@input string mode = "lookAt" {"widget":"combobox", "values":[{"label":"Look At Point", "value":"lookAt"}, {"label":"Look At Direction", "value":"lookAtDir"}, {"label":"Billboard", "value":"billboard"}]}
//@ui {"widget":"separator"}
//@input string constrainAxis = "y" {"widget":"combobox", "values":[{"label":"X", "value":"x"}, {"label":"Y", "value":"y"}, {"label":"Z", "value":"z"}], "showIf":"mode", "showIfValue":"billboard"}
//@input string up = "y" {"widget":"combobox", "values":[{"label":"X", "value":"x"}, {"label":"Y", "value":"y"}, {"label":"Z", "value":"z"}]}
//@input string local = "world" {"widget":"combobox", "values":[{"label":"World", "value":"world"}, {"label":"Local", "value":"local"}]}
//@input vec3 offsetRotation
//@ui {"widget":"separator"}
//@input bool smoothing
//@input float smoothingVal = 5 {"showIf":"smoothing"}
//@ui {"widget":"separator"}
//@input bool flipFacingDir
//@input bool onUpdate
//@input bool onStart

var self = script.getSceneObject();
var selfTransform = self.getTransform();

var targetTransform = null;
var targetPos = new vec3(0, 0, 0);
var selfPos = new vec3(0, 0, 0);

function init() {
    if (!script.target) {
        script.target = global.MainCamera ? global.MainCamera : findCamera();
    }
    targetTransform = script.target.getTransform();
    updateEvent.enabled = script.onUpdate;
    if (script.onStart) {
        script.lookAt();
    }
}

script.start = function () {
    updateEvent.enabled = true;
};

script.stop = function () {
    updateEvent.enabled = false;
};

script.lookAt = function () {
    if (!targetTransform || !selfTransform) {
        print("[LookAt] Missing transforms.");
        return;
    }

    var upVec = getUpVector(script.up);
    var localMode = script.local === "local";

    var targetPos = targetTransform.getWorldPosition();
    var selfPos = selfTransform.getWorldPosition();

    var parentTransform = self.getParent() ? self.getParent().getTransform() : null;
    var worldToLocalMat = parentTransform ? parentTransform.getWorldTransform().inverse() : mat4.identity();

    var lookQuat = null;

    if (script.mode === "lookAt") {
        var dir = script.flipFacingDir ? selfPos.sub(targetPos) : targetPos.sub(selfPos);
        if (dir.lengthSquared === 0) return;

        lookQuat = quat.lookAt(dir.normalize(), upVec);
    } else if (script.mode === "lookAtDir") {
        var forwardVec = script.flipFacingDir ? targetTransform.forward.uniformScale(-1) : targetTransform.forward;
        if (forwardVec.lengthSquared === 0) return;

        lookQuat = quat.lookAt(forwardVec.normalize(), upVec);
    } else if (script.mode === "billboard") {
        var lookDir = script.flipFacingDir ? selfPos.sub(targetPos) : targetPos.sub(selfPos);
        lookDir = constrainDir(lookDir, script.constrainAxis);
        if (lookDir.lengthSquared === 0) return;

        lookQuat = quat.lookAt(lookDir.normalize(), upVec);
    }

    lookQuat = applyRotOffset(lookQuat, script.offsetRotation);

    if(script.smoothing){
        var currentRotation = localMode ? selfTransform.getLocalRotation() : selfTransform.getWorldRotation();
        lookQuat = quat.slerp(currentRotation, lookQuat, script.smoothingVal * getDeltaTime());
    }
    
    if (localMode) {
        selfTransform.setLocalRotation(lookQuat);
    } else {
        selfTransform.setWorldRotation(lookQuat);
    }
};

var updateEvent = script.createEvent("UpdateEvent");
updateEvent.enabled = false;
updateEvent.bind(script.lookAt);

function constrainDir(dir, axis) {
    var constrainedDir = new vec3(dir.x, dir.y, dir.z);
    if (axis === "x") { constrainedDir.x = 0; }
    if (axis === "y") { constrainedDir.y = 0; }
    if (axis === "z") { constrainedDir.z = 0; }
    return constrainedDir;
}

function getUpVector(axis) {
    if (axis === "x") { return new vec3(1, 0, 0); }
    if (axis === "y") { return new vec3(0, 1, 0); }
    if (axis === "z") { return new vec3(0, 0, 1); }
    return new vec3(0, 1, 0);
}

function applyRotOffset(rotation, offsetRotDeg) {
    var rotToApply = quat.fromEulerAngles(degToRad(offsetRotDeg.x), 
        degToRad(offsetRotDeg.y), degToRad(offsetRotDeg.z));
    return rotation.multiply(rotToApply);
}

function degToRad(degrees) {
    return degrees * (Math.PI / 180);
}

function findCamera() {
    for (var i = 0; i < global.scene.getRootObjectsCount(); i++) {
        var object = global.scene.getRootObject(i);
        if (object.getComponents("Component.Camera").length > 0) {
            print("[LookAt] Found camera: " + object.name);
            return object;
        }
    }
}

script.createEvent("OnStartEvent").bind(init);