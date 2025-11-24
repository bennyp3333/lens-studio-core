// MakeMatUnique.js
// Version: 0.1.0
// Description: Clones all materials on the attached Scene Object to make them unique instances.
//  This allows modifying material properties at runtime without affecting other objects sharing the same materials.
//  Supports RenderMeshVisual, Image, and Text3D components.
// Author: Bennyp3333 [https://benjamin-p.dev]
//
// ----- USAGE -----
// 1. Add this script to any Scene Object with a visual component
// 2. Materials are automatically cloned on initialization
// 3. You can now safely modify material properties without affecting other instances


var self = script.getSceneObject();

function init(){
    var meshVisComp = self.getComponent("Component.RenderMeshVisual");
    var imageComp = self.getComponent("Component.Image");
    var text3DComp = self.getComponent("Component.Text3D");
    
    if(meshVisComp){
        makeMatUnique(meshVisComp);
    }

    if (imageComp){
        makeMatUnique(imageComp);
    }

    if(text3DComp){
        makeMatUnique(text3DComp);
    }
}

function makeMatUnique(meshVis) {
    var clonedMaterials = Array(meshVis.getMaterialsCount());
    for (var i = 0; i < clonedMaterials.length; i++) {
        clonedMaterials[i] = meshVis.getMaterial(i).clone();
    }
    meshVis.clearMaterials();
    for (var i = 0; i < clonedMaterials.length; i++) {
        meshVis.addMaterial(clonedMaterials[i]);
    }
    return clonedMaterials;
}

init();