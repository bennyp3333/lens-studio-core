//@input Component.Camera camera
//@ui {"widget":"separator"}
//@input SceneObject popupRef
//@input SceneObject popupParent
//@ui {"widget":"separator"}
//@input SceneObject objRef
//@input Asset.ObjectPrefab objPrefab
//@input SceneObject spawnParent

var touchEvent = script.createEvent("TouchStartEvent");
touchEvent.bind(function(eventData) {
    //Spawn popup at screen position
    var touchPos = eventData.getTouchPosition();
    // Convert 0-1 touch coords to -1 to 1 screen space
    var screenPos = new vec2(
        touchPos.x * 2 - 1,
        1 - touchPos.y * 2
    );
    spawnPopup(screenPos);

    //spawn cube via prefab or sceneObject ref
    var worldPosition = script.camera.screenSpaceToWorldSpace(touchPos, 100);
    if(Math.random() > 0.5){
        var box = global.spawn.create(script.objRef, script.spawnParent, "boxes");
        box.script.setPosition(worldPosition);
    }else{
        var box = global.spawn.create(script.objPrefab, script.spawnParent, "boxes");
        box.script.setPosition(worldPosition);
    }
});

function spawnPopup(screenPos) {
    var popup = global.spawn.create(script.popupRef, script.popupParent, "popups");
    if (popup && popup.script) {
        popup.script.animate(screenPos);
    }
    return popup;
};