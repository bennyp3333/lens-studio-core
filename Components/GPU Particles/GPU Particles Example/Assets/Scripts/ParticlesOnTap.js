//@input Component.ScriptComponent particles

var tapEvent = script.createEvent("TapEvent");
tapEvent.bind(function(eventData){
    script.particles.toggle();
});