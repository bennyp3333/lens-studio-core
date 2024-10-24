//@input Component.Text text
//@input float smoothing = 0.75 {"widget":"slider", "min":0.0, "max":0.95, "step":0.05}

var fps;
var fpsAvg;

function updateFPS(eventData){
    if(eventData.getDeltaTime() > 0){
        fps = 1.0 / eventData.getDeltaTime();
        if(!fpsAvg){ fpsAvg = fps; }
        fpsAvg = (fps * (1 - script.smoothing)) + (fpsAvg * script.smoothing);
        script.text.text = "FPS: " + fpsAvg.toFixed(0);
    }
}

script.createEvent("UpdateEvent").bind(updateFPS);