/*
TouchBlocking.js
Version: 1.0.0
Description: Overrides Snapchat's native touch handling at the scene level, preventing
             the app from responding to gestures while your lens is active. Useful for
             lenses that rely on tap, swipe, or pan input. Individual touch types can 
             be selectively re-allowed via exceptions.
Author: sarperozkiziltan, Bennyp3333 [https://benjamin-p.dev]

 ==== USAGE ====
 1. Add this script to a SceneObject
 2. Enable "Enable Touch Blocking" to override all of Snapchat's default touch behaviors
 3. Optionally enable "Exceptions" and check any touch types Snapchat should still handle:
    - Swipe    : Pan gesture (e.g. swipe to Stories/Chat)
    - Touch    : Generic touch
    - Tap      : Single tap (e.g. switch camera)
    - DoubleTap: Double-tap (e.g. switch camera)
    - Scale    : Two-finger pinch
    - Pan      : Pan/drag gesture
    - None     : No touch
*/

//@input bool enableTouchBlocking
//@input bool exceptions
//@ui {"widget":"group_start", "label":"Exceptions", "showIf": "exceptions"}
//@input bool TouchTypeSwipe
//@input bool TouchTypeTouch
//@input bool TouchTypeTap
//@input bool TouchTypeDoubleTap
//@input bool TouchTypeScale
//@input bool TouchTypePan
//@input bool TouchTypeNone
//@ui {"widget":"group_end"}

global.touchSystem.touchBlocking = script.enableTouchBlocking;

global.touchSystem.enableTouchBlockingException("TouchTypeDoubleTap", script.TouchTypeDoubleTap);
global.touchSystem.enableTouchBlockingException("TouchTypePan", script.TouchTypePan);
global.touchSystem.enableTouchBlockingException("TouchTypeScale", script.TouchTypeScale);
global.touchSystem.enableTouchBlockingException("TouchTypeSwipe", script.TouchTypeSwipe);
global.touchSystem.enableTouchBlockingException("TouchTypeTap", script.TouchTypeTap);
global.touchSystem.enableTouchBlockingException("TouchTypeTouch", script.TouchTypeTouch);
global.touchSystem.enableTouchBlockingException("TouchTypeNone", script.TouchTypeNone);
