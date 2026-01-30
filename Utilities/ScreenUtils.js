/*
ScreenUtils.js
Version: 1.0.0
Description: Screen space conversion and 2D collision detection utilities for ScreenTransform components.
Author: Bennyp3333 [https://benjamin-p.dev]
*/

/**
 * Converts a point from 0-1 screen space to -1 to 1 screen space.
 * @param {vec2} point - Point in 0-1 space (0,0 = top-left, 1,1 = bottom-right)
 * @returns {vec2} Point in -1 to 1 space (-1,-1 = bottom-left, 1,1 = top-right)
 */
function screenPoint01ToNormalized(point) {
    return new vec2(
        point.x * 2 - 1,
        (1 - point.y) * 2 - 1
    );
}

/**
 * Converts a point from -1 to 1 screen space to 0-1 screen space.
 * @param {vec2} point - Point in -1 to 1 space (-1,-1 = bottom-left, 1,1 = top-right)
 * @returns {vec2} Point in 0-1 space (0,0 = top-left, 1,1 = bottom-right)
 */
function screenPointNormalizedTo01(point) {
    return new vec2(
        (point.x + 1) / 2,
        1 - (point.y + 1) / 2
    );
}

/**
 * Converts local bounds to screen space (-1 to 1).
 * @param {ScreenTransform} st - The ScreenTransform to use for conversion
 * @param {Rect} [localRect] - Optional Rect in local space. If omitted, uses full bounds (-1,-1 to 1,1)
 * @returns {Rect} Bounds in screen space (-1 to 1)
 */
function localToScreenRect(st, localRect) {
    var left = localRect ? localRect.left : -1;
    var right = localRect ? localRect.right : 1;
    var bottom = localRect ? localRect.bottom : -1;
    var top = localRect ? localRect.top : 1;
    
    var bl01 = st.localPointToScreenPoint(new vec2(left, bottom));
    var tr01 = st.localPointToScreenPoint(new vec2(right, top));
    
    var bl = screenPoint01ToNormalized(bl01);
    var tr = screenPoint01ToNormalized(tr01);
    
    return Rect.create(bl.x, tr.x, bl.y, tr.y);
}

/**
 * Converts screen space bounds (-1 to 1) to local space.
 * @param {ScreenTransform} st - The ScreenTransform to use for conversion
 * @param {Rect} [screenRect] - Optional Rect in screen space. If omitted, uses full screen (-1,-1 to 1,1)
 * @returns {Rect} Bounds in local space (-1 to 1)
 */
function screenToLocalRect(st, screenRect) {
    var left = screenRect ? screenRect.left : -1;
    var right = screenRect ? screenRect.right : 1;
    var bottom = screenRect ? screenRect.bottom : -1;
    var top = screenRect ? screenRect.top : 1;
    
    var bl01 = screenPointNormalizedTo01(new vec2(left, bottom));
    var tr01 = screenPointNormalizedTo01(new vec2(right, top));
    
    var bl = st.screenPointToLocalPoint(bl01);
    var tr = st.screenPointToLocalPoint(tr01);
    
    return Rect.create(bl.x, tr.x, bl.y, tr.y);
}

/**
 * Checks if a point is within the bounds of a Rect.
 * @param {vec2} point - The point to check
 * @param {Rect} rect - The Rect bounds to check against
 * @returns {boolean} True if the point is inside the rect
 */
function pointInRect(point, rect) {
    return point.x >= rect.left && 
           point.x <= rect.right && 
           point.y >= rect.bottom && 
           point.y <= rect.top;
}

/**
 * Checks if two Rects overlap.
 * @param {Rect} a - First Rect
 * @param {Rect} b - Second Rect
 * @returns {boolean} True if the rects overlap
 */
function rectsOverlap(a, b) {
    return a.left <= b.right && 
           a.right >= b.left && 
           a.bottom <= b.top && 
           a.top >= b.bottom;
}

/**
 * Checks if the center of one ScreenTransform is within the bounds of another.
 * @param {ScreenTransform} innerSt - The ScreenTransform whose center we're checking
 * @param {ScreenTransform} outerSt - The ScreenTransform whose bounds we're checking against
 * @returns {boolean} True if innerSt's center is within outerSt's bounds
 */
function isCenterWithinBounds(innerSt, outerSt) {
    var center = localToScreenRect(innerSt).getCenter();
    var bounds = localToScreenRect(outerSt);
    
    return pointInRect(center, bounds);
}

/**
 * Checks if the bounds of two ScreenTransforms overlap in screen space.
 * @param {ScreenTransform} stA - First ScreenTransform
 * @param {ScreenTransform} stB - Second ScreenTransform
 * @returns {boolean} True if the bounds overlap
 */
function doBoundsOverlap(stA, stB) {
    var boundsA = localToScreenRect(stA);
    var boundsB = localToScreenRect(stB);
    
    return rectsOverlap(boundsA, boundsB);
}

/**
 * Calculates the distance between the centers of two ScreenTransforms in screen space.
 * Optionally accounts for aspect ratio to give uniform distance in both axes.
 * @param {ScreenTransform} stA - First ScreenTransform
 * @param {ScreenTransform} stB - Second ScreenTransform
 * @param {Camera} [camera] - Optional Camera component for aspect ratio correction
 * @returns {number} The distance between centers
 */
function getScreenSpaceDistance(stA, stB, camera) {
    var centerA = localToScreenRect(stA).getCenter();
    var centerB = localToScreenRect(stB).getCenter();
    
    var delta = centerA.sub(centerB);
    
    if (camera) {
        delta = new vec2(delta.x * camera.aspect, delta.y);
    }
    
    return delta.length;
}

var exports = {
    screenPoint01ToNormalized,
    screenPointNormalizedTo01,
    localToScreenRect,
    screenToLocalRect,
    pointInRect,
    rectsOverlap,
    isCenterWithinBounds,
    doBoundsOverlap,
    getScreenSpaceDistance
};

if(script){
    script.exports = exports;
    if(!global.utils){ global.utils = {}; }
    Object.assign(global.utils, exports);
}else{
    module.exports = exports;
}