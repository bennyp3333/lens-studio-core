//@input SceneObject exampleAsset1
//@input SceneObject exampleAsset2
//@input SceneObject[] exampleAssets

//Global Function examples
global.exampleOn = function(buttonID, buttonData){
    print("Button switched on - buttonID: " + buttonID + " - data: " + buttonData);
    script.exampleAsset1.enabled = true;
}

global.exampleOff = function(buttonID, buttonData){
    print("Button switched off - buttonID: " + buttonID + " - data: " + buttonData);
    script.exampleAsset1.enabled = false;
}

global.exampleGo = function(buttonID, buttonData){
    print("Button pressed - buttonID: " + buttonID + " - data: " + buttonData);
    global.tweenManager.startTween(script.exampleAsset2, "spin");
}

//Custom Function Examples
script.api.arrayTest = function(buttonID, buttonData, arrayData){
    print("Button selected - buttonID: " + buttonID + " - button data: " + buttonData + " - array data: " + arrayData);
    for(var i = 0; i < script.exampleAssets.length; i++){
        script.exampleAssets[i].enabled = false;
    }
    script.exampleAssets[buttonID].enabled = true;
}
