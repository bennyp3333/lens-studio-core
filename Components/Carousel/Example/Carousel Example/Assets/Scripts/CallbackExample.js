//@input Asset.Material particles

function onCarouselSelect(index, element) {
    print("Element selected: " + index);
    
    // Get texture from the selected element
    var img = element.obj.getComponent("Component.Image");
    if (img) {
        script.particles.mainPass.mainTexture = img.mainPass.baseTex;
    }
}

global.onCarouselSelect = onCarouselSelect;
script.onCarouselSelect = onCarouselSelect;