// MakeMatUnique.js
// Version: 1.0.0
// Description: Clones all materials on the attached Scene Object to make them unique instances.
//  This allows modifying material properties at runtime without affecting other objects sharing the same materials.
//  Supports RenderMeshVisual, Image, and Text3D components, including multiple of each on the same object.
// Author: Bennyp3333 [https://benjamin-p.dev]
//
// ----- USAGE -----
// 1. Add this script to any Scene Object with a visual component
// 2. Materials are automatically cloned on initialization
// 3. You can now safely modify material properties without affecting other instances


var self = script.getSceneObject();

function init(){
    var meshVisComps = self.getComponents("Component.RenderMeshVisual");
    var imageComps = self.getComponents("Component.Image");
    var text3DComps = self.getComponents("Component.Text3D");

    for (var i = 0; i < meshVisComps.length; i++) {
        makeMatUnique(meshVisComps[i]);
    }

    for (var i = 0; i < imageComps.length; i++) {
        makeMatUnique(imageComps[i]);
    }

    for (var i = 0; i < text3DComps.length; i++) {
        makeMatUnique(text3DComps[i]);
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