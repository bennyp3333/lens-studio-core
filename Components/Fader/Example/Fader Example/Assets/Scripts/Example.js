//@input SceneObject tapPrompt
//@input Component.InteractionComponent restartButton

var startReady = true;
var restartReady = false;

function init(){
    script.restartButton.onTap.add(function(tapEventArgs){
        restart();
    });
    print("init");
    
}

function onTap(){
    print("tap detected!");
    start();
}

function start(){
    if(!startReady){ return; }
    startReady = false;

    print("starting!");
    global.faderManager.hide(script.tapPrompt, function(){
        print("fade complete");
        stage1();
    });
}

function stage1(){
    print("stage 1");
    global.faderManager.show(["Red", "Green"]);
    global.faderManager.show("Blue", {delay: 0.5}, function(){
        stage2();
    });
}

function stage2(){
    print("stage 2");
    global.faderManager.hide(["Red", "Blue"], {delay: 0.5, time: 2, onComplete: function(){
         stage3();   
    }});
    global.faderManager.hide("Green", {time: 1.0});
}

function stage3(){
    print("stage 3");
    global.faderManager.show("Colors", stage4);
}

function stage4(){
    print("stage 4");
    global.faderManager.hide(["Red", "Green", "Blue"], {onComplete: stage5});
}

function stage5(){
    print("stage 5");
    global.faderManager.show(["Smile"]);
    global.faderManager.show(["Text3D", "Box"], showRestartButton);
}

function showRestartButton(){
    print("Complete!");
    global.faderManager.show("Restart", {delay: 1}, function(){
        restartReady = true;
    });
}

function restart(){
    if(!restartReady){ return; }
    restartReady = false;

    global.faderManager.hide("Restart", {time: 0.25});
    global.faderManager.hide(["Text3D", "Box", "Smile"]);
    global.faderManager.show(script.tapPrompt, {delay: 0.5}, function(){
        startReady = true;
    });
}

script.createEvent("OnStartEvent").bind(init);
script.createEvent("TapEvent").bind(onTap);