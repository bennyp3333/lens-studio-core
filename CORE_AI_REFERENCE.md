# lens-studio-core — AI Reference

Dense API + code-style digest of **Core**, a personal Lens Studio (Snap) script library.
Optimised for coding agents, not humans. The per-folder `README.md` files are the human docs.

## 0. How to use this file

- Consumer projects import the **compiled** `Core.lspkg` — its source is invisible there.
  The real source lives in **this repo**; every entry below gives an absolute path.
- This file is the **source of truth** for (a) what Core exposes, (b) how to call it,
  (c) the house code style. It lists every script and every public entry point so you know
  what exists; open the cited source file when you need behavioural detail it doesn't cover.
- Signature grammar: `name(req, opt?, x=default) -> ReturnType`. `?` = optional arg.
- Paths are `D:\Nextcloud\Projects\Reference\lens-studio-core\<subpath>`. The exporter
  mirrors `Classes\ Components\ Managers\ Utilities\` verbatim into
  `Core Template\Assets\Core\<same subpath>` before building `Core.lspkg` (see §8).

### Repo map (only these are tracked)

| Dir | What |
|---|---|
| `Classes\` | `CallbackTracker.js`, `DelayManager.js` — plain classes, exposed on `global` |
| `Managers\` | Singletons wired by the Core prefab: TouchBlocking, AudioManager, GlobalEvents, GlobalUtils, DelayManager glue, SpawnManager, TextLogger |
| `Utilities\` | 13 function modules merged into `global.utils` / `global.easing` / `global.simpleTween` / `global.BaseTools` |
| `Components\` | Drop-on-object scripts (buttons, fader, carousel, games, particles, spawnables, misc) + `BaseScript.js` template |
| `Shaders\` | Reusable shader graphs / subgraphs (not covered here) |
| `Core.lspkg` | The built package consumers import |
| `sync_to_template.py` | Pre-export sync step (§8) |

`Core Template\` and `Todo\` are git-ignored local-only (an LS project + scratch).

---

## 1. Runtime & init model

- Consumer drops **one `Core.prefab`** at the top of the Objects panel. It carries the
  manager scripts; **most are disabled by default** for perf — the user ticks on only what
  a project needs: `TouchBlocking, AudioManager, GlobalEvents, DelayManager, GlobalUtils,
  SpawnManager, TextLogger`.
- **Init order** (dependency-driven): `TouchBlocking -> AudioManager -> CallbackTracker ->
  GlobalEvents -> DelayManager -> GlobalUtils -> SpawnManager -> TextLogger`.
- Consumer code never `require()`s Core — everything is reached through `global.*` (§2).
- **Utility dual-mode footer** — every `Utilities\*.js` ends with:
  ```js
  var exports = { fnA, fnB };
  if (script) { script.exports = exports; if(!global.utils){global.utils={};} Object.assign(global.utils, exports); }
  else { module.exports = exports; }
  ```
  So each util file works both as a scene ScriptComponent (auto-registers into
  `global.utils`) and as a `require()`-able module.
- **`GlobalUtils.js`** `require()`s the 10 core util modules (each toggleable via its
  Advanced Options input), merges their exports into `global.utils`, and prints
  `"Conflict detected for function name: X"` on any name clash. It **also** merges the
  `.exports` of every other ScriptComponent sharing its SceneObject — which is why
  `Easing` / `SimpleTween` / `AsyncUtils` (not in the require list) still surface on
  `global.utils` in the default prefab layout.

---

## 2. Global namespace cheat-sheet

Core-owned (created by the scripts in this repo):

| Handle | Owner file | Note |
|---|---|---|
| `global.utils` | `Managers\GlobalUtils.js` | all Utilities merged in; see §5 |
| `global.easing` | `Utilities\Easing.js` | 31 easing curves; also mirrored onto `global.utils` |
| `global.simpleTween` | `Utilities\SimpleTween.js` | `simpleTween(...)` fn; also on `global.utils.simpleTween` |
| `global.BaseTools` | `Utilities\BaseTools.js` | `global.BaseTools(script)` injects delay/loop helpers onto `script` |
| `global.AsyncBaseTools` | `Utilities\AsyncUtils.js` | `global.AsyncBaseTools(script)` injects promise helpers |
| `global.events` | `Managers\GlobalEvents.js` | `.add/.remove/.trigger`; needs `global.CallbackTracker` |
| `global.CallbackTracker` | `Classes\CallbackTracker.js` | class; engine under `global.events` |
| `global.Delay` | `Classes\DelayManager.js` | `global.Delay(options) -> ManagedDelay` |
| `global.DelayManager` | `Classes\DelayManager.js` | class; `.globalInstance`; `new global.DelayManager(script)` for a local group |
| `global.stopDelays` | `Classes\DelayManager.js` | `global.stopDelays(tag?)` — the only free delay fn on `global` (pause/resume live on a manager instance) |
| `global.audioManager` | `Managers\AudioManager.js` | named-track playback; see §6 |
| `global.spawn` | `Managers\SpawnManager.js` | prefab/template spawning + registry; see §6 |
| `global.faderManager` | `Components\Fader\Fader.js` | created by the first Fader instance; see §7 |
| `global.GPUParticles` | `Components\GPU Particles\GPUParticlesController.js` | registry, created by first controller |
| `global.textLogger` | `Managers\TextLogger.js` | on-screen log object |
| `global.logToScreen(msg)` | `Managers\TextLogger.js` | = `textLogger.addLog` |
| `global.logError(msg)` | `Managers\TextLogger.js` | = `textLogger.addErrorLog` (renders red) |
| `global.isFrontCamera` / `global.isBackCamera` | `Components\CameraSwitcher.js` | bools, updated on camera-switch events |

Lens-Studio built-ins Core **consumes** (not Core's): `global.scene`, `global.touchSystem`,
`global.persistentStorageSystem`, `global.hapticFeedbackSystem`, `global.behaviorSystem`,
`global.MainCamera` (LookAt falls back to it).

---

## 3. Code style & conventions

### 3.1 Writing a NEW script — start from `BaseScript.js`

`D:\Nextcloud\Projects\Reference\lens-studio-core\Components\BaseScript.js` is the user's
copy-first template for every new script. Copy it as-is, add the header block (§3.3) at the
top, then write your logic. The `debug` / `debugName` / `debugText` input trio and the
`debugPrint(text, force)` helper are **house boilerplate present in essentially every
script** — keep them.

`BaseScript.js` verbatim:

```js

//@ui {"widget":"separator"}
//@input bool debug
//@input string debugName = "" {"showIf":"debug"}
//@input Component.Text debugText {"showIf":"debug"}

global.BaseTools(script);

var self = script.getSceneObject();
var selfTransform = self.getTransform();

function init() {
    // Example: delayed action
    // script.delay(1.0, function() {
    //     debugPrint("1 second later!");
    // });

    debugPrint("Initialized!");
}

function onUpdate(){

    //debugPrint("Updated!");
}

script.createEvent("OnStartEvent").bind(init);
script.createEvent("UpdateEvent").bind(onUpdate);

// Debug
function debugPrint(text, force) {
    if (!force && !script.debug) return;
    var newLog = "[" + (script.debugName || self.name) + "] " + text;
    if(global.textLogger) global.logToScreen(newLog);
    if(script.debugText) script.debugText.text = newLog;
    print(newLog);
}
```

Managers and the bigger components instead use a heavier **pair**,
`printDebug(msg)` + `printWarning(msg)` (prefix `"Name sceneObj - "`, route to
`global.logToScreen` / `global.logError`, gated by inspector bools
`printDebugStatements=false` / `printWarningStatements=true`). Both styles no-op unless
their inspector toggle is on. Some files name the single helper `debugLog(msg, force)`.
Match whatever the file you're editing already uses.

### 3.2 Language level

- **ES5-dominant.** `var` everywhere; `function foo(){}` declarations; "classes" are
  constructor-function + `.prototype` (`CallbackTracker`, `DelayManager`/`ManagedDelay`,
  `AudioManager`, `Fader`/`FaderManager`/`Animation`, `GPUParticlesManager`,
  `EventDispatcher`).
- ES2019+ (`const`/`let`, arrow fns, default params, `Array.prototype.some`) appears only
  sporadically (`RandomUtils.createDistributedRandom`, `GlobalUtils`, bits of `SceneUtils`,
  `Easing` locals). New code **may** use ES2019 (the project targets ES2021), but the house
  default is plain ES5 — prefer it unless the file you're in already went modern.
- No `window`/`document`. Runtime globals: `print()`, `getTime()`, `getDeltaTime()`,
  `vec2/vec3/vec4/quat`, `Rect`, `LayerSet`, `Camera.Type.*`, `HapticFeedbackType.*`.

### 3.3 File header block

```
/*
Name.js
Version: X.Y.Z
Description: ...
Author: <name> [<url>]

 ==== Usage ====  / ==== Examples ====  / ==== API ====  / ==== Notes ====   (optional)
*/
```

Every file in this repo carries this block. For the `Author:` line, **match the existing
files** when adding to this repo — they use `Bennyp3333 [https://benjamin-p.dev]`. If you
have forked Core, substitute your own name/URL (or whatever your editor config / local
context specifies). `Version` is semver, bumped on every change to that file; release
commits are `Export Core vX.Y.Z` and tagged `vX.Y.Z`. Smaller/older files use a
`// line-comment` header instead of the block (`BaseTools`, `AsyncUtils`, `SpawnManager`,
`TextLogger`, the button family, `EnableOnStart`, `MakeMatUnique`, `CameraSwitcher`,
`SpawnableBase`). Keep whichever form the file uses.

### 3.4 Formatting

- 4-space indent. A few files use tabs (`SpawnManager`, the button family,
  `GPUParticlesController`) — match the file.
- K&R braces. Brace-hugging (`function x(){` vs `function x() {`) varies per file — match
  the file.
- `camelCase` funcs/vars, `PascalCase` constructors, `SCREAMING_SNAKE` const maps
  (`MODE_KEYS`), `_leadingUnderscore` for "private" prototype methods on the bigger classes.
- JSDoc (`/** @param {type} name - desc @returns {type} */`) on ~every function in
  `Utilities\*` and on public API methods of components. Terse `//` comments in glue code.

### 3.5 Inputs (`//@input` / `//@ui`)

- `//@input Type name = default {"label":"..","hint":"..","showIf":"otherInput","showIfValue":X,"widget":"combobox|slider|color"}`
- Layout widgets: `//@ui {"widget":"group_start","label":"..","showIf":".."}` /
  `{"widget":"group_end"}` / `{"widget":"separator"}` / `{"widget":"label","label":".."}`.
- Collapsible groups gated by a leading bool: `advanced` / `editAdvancedOptions` /
  `moreOptions` / `editEventCallbacks` / `optional`.
- A trailing **Advanced Options** group almost always holds
  `//@input bool printDebugStatements = false` and `//@input bool printWarningStatements = true`.
- Combobox: `{"widget":"combobox","values":[{"label":"A","value":0},{"label":"B","value":1}]}`.

### 3.6 Recurring patterns

- **Events:** `script.createEvent("<EventType>").bind(fn)`. Types in use: `OnStartEvent`,
  `UpdateEvent`, `TapEvent`, `TouchStartEvent`/`TouchMoveEvent`/`TouchEndEvent`,
  `DelayedCallbackEvent` (`.reset(seconds)`), `CameraFrontEvent`/`CameraBackEvent`,
  `OnDestroyEvent`. Update events are typically created, set `.enabled = false`, then
  toggled on demand. `script.removeEvent(evt)` to dispose.
- **Public API exposure:** assign onto `script.*` — methods, plus `script.onXxx` event
  objects (a local `EventDispatcher` with `.add(fn)` / `.remove(fn)` / `.trigger(...)`).
- **Chainable config:** setters `return script;` so calls chain (`Timer`, `Score`).
- **Manager singletons:** file-scope `function init(){ global.x = new X(); } init();`.
- **Inspector callback pattern** (buttons, camera, detectors, carousel): a `callbackType`
  combobox resolved in a `switch`, with sibling string inputs. **Value meanings differ:**
  buttons/camera use `0 None / 1 Global Function / 2 Custom Function` (+
  `*GlobalFunctionName`, `*GlobalFunctionData`, `customFunctionScript`, `*FunctionName`,
  `*FunctionData`); SwipeDetector / HeadTiltDetector / LinearCarousel use
  `0 Global Function / 1 Custom Script`.
- **Spawnable marker:** `script.isSpawnable = true; script.spawnId = null;
  script.spawnGroup = null; script.spawnManager = null;` + `script.onSpawned` /
  `script.onDespawn` / `script.despawn()` / `script.despawnAfter(delay)`. Carousel elements
  use the parallel `script.isCarouselElement = true`.
- **Material safety:** several components carry their own local
  `makeMatUnique(meshVis)` (clone each material -> `clearMaterials()` -> `addMaterial()`).
  The shared version is `global.utils.makeMatUnique` / `makeMatUniqueObject`. Always make a
  material unique before mutating `mainPass` on an instance that shares its material.

---

## 4. Utilities

Path root: `D:\Nextcloud\Projects\Reference\lens-studio-core\Utilities\`.
Unless noted, functions are called as `global.utils.<name>(...)`.

### MathUtils.js — `global.utils.*`

| Signature | Notes |
|---|---|
| `lerp(a, b, t) -> number` | linear interpolation |
| `clamp(val, min, max) -> number` | |
| `remap(val, inMin, inMax, outMin, outMax, shouldClamp?) -> number` | |
| `approxEqual(v1, v2, epsilon=0.001) -> bool` | |
| `degreesToRadians(deg) -> number` | |
| `radiansToDegrees(rad) -> number` | |
| `rotateQuat(currentRot, angleDeg, axisVec3) -> quat` | rotate a quat about an axis |
| `getAngleOfQuat(quat, axis) -> number` | `axis` = `"x"`/`"y"`/`"z"`; accurate for single-axis rotations |
| `getWAngleOfQuat(quat) -> number` | total angle from the w component |

### ArrayUtils.js — `global.utils.*`

| Signature | Notes |
|---|---|
| `createArray(length, ...) -> Array` | extra args -> nested dims |
| `cloneArray(array) -> Array` | shallow copy |
| `removeFromArray(array, element) -> bool` | removes first match in place |
| `arrayIncludes(array, thing) -> bool` | |
| `arrayRemoveDuplicates(array) -> Array` | new array |
| `shuffleArray(array) -> void` | in-place Fisher–Yates |
| `indexOfMax(array) -> number|null` | |
| `getMax(array) -> *` | max value |
| `forEach(array, fn) -> void` | `fn(el, i)`; logs + returns if array is null |
| `filterArray(array, filterFn) -> Array` | null-guarded |

### RandomUtils.js — `global.utils.*`

| Signature | Notes |
|---|---|
| `randomRange(lo, hi) -> number` | |
| `arrayRandom(arr) -> *` | random element |
| `objectRandom(obj) -> *` | random value (random key) |
| `randomVec2(min=0, max=1) -> vec2` | each component in `[min,max]` |
| `randomVec3(min=0, max=1) -> vec3` | |
| `randomVec4(min=0, max=1) -> vec4` | |
| `randomQuaternion() -> quat` | uniform random rotation |
| `createDistributedRandom(min, max, minSpacing, historySize=3) -> (): number` | returns a **generator**; each call rejection-samples away from recent outputs, falls back to pure random after 50 tries |

### ColorUtils.js — `global.utils.*`  (all colour channels normalised 0–1)

| Signature | Notes |
|---|---|
| `rgbToHsv(color) -> vec3|vec4` | keeps alpha if input is vec4 |
| `hsvToRgb(color) -> vec3|vec4` | |
| `hexToRgb(hex, alpha?) -> vec3|vec4` | accepts `#FF5500` / `FF5500` / `#F50` / `F50`; vec4 if `alpha` given |
| `rgbToHex(color, includeHash=true) -> string` | |
| `colorRandom(alpha?) -> vec4` | alpha randomised when omitted |
| `randomColorHue(brightness, saturation, alpha=1.0) -> vec4` | random hue at fixed S/V |

### ObjectUtils.js — `global.utils.*`

| Signature | Notes |
|---|---|
| `setDefault(obj, key, def) -> *` | sets `obj[key]=def` if absent; returns the effective value |

### SceneUtils.js — `global.utils.*`  (pass `null` root = search whole scene)

| Signature | Notes |
|---|---|
| `setEnabled(objOrArray, value) -> void` | SceneObject(s) or Component(s) |
| `enable(objOrArray) -> void` / `disable(objOrArray) -> void` | |
| `findFirstSceneObjectByName(root, name) -> SceneObject|null` | |
| `searchSceneObjectsByName(root, name) -> SceneObject[]` | |
| `findFirstByPredicate(obj, predicate) -> SceneObject|null` | `predicate(sceneObject)->bool` |
| `searchByPredicate(obj, predicate) -> SceneObject[]` | |
| `findFirstComponentByType(root, "Component.X") -> Component|null` | |
| `searchComponentsByType(root, "Component.X") -> Component[]` | |
| `isDescendantOf(sceneObject, root) -> bool` | |
| `applyToDescendants(rootObject, fn) -> void` | post-order; also calls `fn(rootObject)` |
| `findScript(sceneObj, propName?, filterFunc?) -> ScriptComponent|null` | matches a ScriptComponent that has `propName` and/or passes `filterFunc` |
| `findScriptUpwards(sceneObj, propName?, filterFunc?, allowSelf) -> ScriptComponent|null` | walks parents |
| `recursiveAlpha(rootObj, alpha, effectDisabled) -> void` | sets alpha on every RenderMeshVisual/Image/Text3D (`mainPass.baseColor`) + Text (`textFill.color`) in the hierarchy; skips disabled objects unless `effectDisabled` |
| `getChildren(sceneObject, depth=1) -> SceneObject[]` | flat; `depth=Infinity` for all descendants |

### ScreenUtils.js — `global.utils.*`  (ScreenTransform / Rect helpers)

| Signature | Notes |
|---|---|
| `screenPoint01ToNormalized(pt) -> vec2` | `0..1` (0,0=top-left) -> `-1..1` (-1,-1=bottom-left) |
| `screenPointNormalizedTo01(pt) -> vec2` | inverse |
| `localToScreenRect(st, localRect?) -> Rect` | local bounds -> screen `-1..1`; default = full bounds |
| `screenToLocalRect(st, screenRect?) -> Rect` | inverse |
| `pointInRect(pt, rect) -> bool` | |
| `rectsOverlap(a, b) -> bool` | |
| `isCenterWithinBounds(innerSt, outerSt) -> bool` | |
| `doBoundsOverlap(stA, stB) -> bool` | |
| `getScreenSpaceDistance(stA, stB, camera?) -> number` | pass a Camera for aspect-ratio correction |

### ComponentUtils.js — `global.utils.*`  (visual comps: RenderMeshVisual, Image, Text3D, Text)

| Signature | Notes |
|---|---|
| `getAlphaObject(obj) -> number|undefined` | auto-detects the visual component |
| `getAlpha(meshVis) -> number` | `mainPass.baseColor.a` |
| `setAlphaObject(obj, alpha) -> void` | auto-detects component; Text uses `textFill.color` |
| `setAlpha(meshVis, alpha) -> Array` | applies across all materials; returns updated colours |
| `makeMatUniqueObject(obj) -> void` | clones materials on all RenderMeshVisual/Image/Text3D |
| `makeMatUnique(meshVis) -> Array` | clone -> `clearMaterials` -> `addMaterial`; returns clones |
| `makeMatArrayUnique(meshVisArray) -> Array` | clone from `[0]`, share the same clones to the rest |

### StringUtils.js — `global.utils.*`

| Signature | Notes |
|---|---|
| `stringSimilarity(s1, s2) -> number` | 0..1, Levenshtein-based (`getEditDistance` is internal) |
| `randomId(len) -> string` | alphanumeric |
| `chunkText(txt, len) -> string[]` | splits at ≤`len`, preferring `\n` `.` `,` space |
| `typeWrite(text, setter, options?, callback?) -> Event|null` | typewriter effect via `global.simpleTween`. `text===""` deletes. `options` = `{ startText:"", charDuration:0.01, deleteDuration:0.15, delay:0 }`. `setter(currentString)` called per frame. Returns the update event (disable to cancel). |

### Easing.js — `global.easing.*`  (also mirrored onto `global.utils.*`)

`fn(t) -> number`, `t` in `[0,1]`. 31 curves:
`linear`; `easeIn/Out/InOutSine`; `…Quad`; `…Cubic`; `…Quart`; `…Quint`; `…Expo`;
`…Circ`; `easeIn/Out/InOutBack` (opt 2nd arg `magnitude=1.70158`);
`easeIn/Out/InOutElastic` (opt `magnitude` ~0.7); `easeOutBounce`, `easeInBounce`,
`easeInOutBounce`.

### SimpleTween.js — `global.simpleTween`  (also `global.utils.simpleTween`)

| Signature | Notes |
|---|---|
| `simpleTween(startVal, endVal, time, delay, updateCallback?, doneCallback?) -> UpdateEvent` | linear only (apply an easing fn yourself inside `updateCallback`). `updateCallback(val)` per frame, `doneCallback(val)` at end. Set the returned event `.enabled = false` to cancel. |

### BaseTools.js — `global.BaseTools(script)` injects onto `script`

Call once near the top of a script (after inputs). Lightweight alternative to DelayManager.

| Injected method | Notes |
|---|---|
| `script.delay(seconds, cb) -> DelayedCallbackEvent` | `.enabled=false` to cancel |
| `script.delayTween(seconds, obj, tweenName) -> DelayedCallbackEvent` | needs `global.tweenManager` |
| `script.delayAudio(seconds, action, audioComp, loops) -> DelayedCallbackEvent` | `action` = `"play"`/`"stop"` |
| `script.delayEnable(seconds, obj, state) -> DelayedCallbackEvent` | |
| `script.delayFrames(nFrames, cb) -> UpdateEvent` | |
| `script.makeLoop(seconds, cb, firstTime=0) -> { event, setInterval(n), stop(), start(firstTime?) }` | repeating timer |
| `script.createAudioComp(audioTrack?) -> AudioComponent` | created on this SceneObject |

### AsyncUtils.js — `global.AsyncBaseTools(script)` injects onto `script`

| Injected method | Notes |
|---|---|
| `script.delayAsync(seconds) -> Promise<void>` | |
| `script.playTweenAsync(sceneObject, tweenName) -> Promise<void>` | needs `global.tweenManager` |

---

## 5. Classes

Path root: `D:\Nextcloud\Projects\Reference\lens-studio-core\Classes\`.

### CallbackTracker.js — `global.CallbackTracker`

Engine under `global.events` — **prefer `global.events`** (§6) for normal use.

`new global.CallbackTracker(scriptComponent)` — reads `scriptComponent.callbackType`.

| Method | Notes |
|---|---|
| `addCallback(eventName, cb) -> void` | |
| `removeCallback(eventName, cb) -> void` | |
| `invokeScriptedCallbacks(eventName, data) -> void` | JS callbacks only |
| `invokeCallbacks(eventName, data) -> void` | Behavior / global-trigger / custom-function callbacks per `callbackType` |
| `invokeAllCallbacks(eventName, data) -> void` | both of the above |

`callbackType`: `1` Behavior components (`scriptComponent[name+"Behaviors"]`), `2` global
behavior triggers (`global.behaviorSystem.sendCustomTrigger`, `[name+"GlobalBehaviors"]`),
`3` custom functions (`scriptComponent.customFunctionScript[name+"FunctionNames"][i]`).

### DelayManager.js — `global.Delay`, `global.DelayManager`, `global.stopDelays`

- `global.Delay(options) -> ManagedDelay` — via `DelayManager.globalInstance`.
- `new global.DelayManager(ownerScript) -> DelayManager` — a local group. Instance:
  `.Delay(options)`, `.delays` (array), `.stopDelays(tag?)`, `.pauseDelays(tag?)`,
  `.resumeDelays(tag?)`, `.purge()`. `DelayManager.globalInstance` is the shared one.
- `global.stopDelays(tag?)` — stops on the global instance (only free delay fn on `global`;
  for pause/resume by tag use `global.DelayManager.globalInstance.pauseDelays(tag)`).

**`options`**: `time` (s) · `frames` (int; wins if both set) · `loops` (default 1, `<0` =
infinite) · `onLoop(...(args), loopIndex, totalLoops)` · `onComplete(...args)` ·
`args` (`*` or `*[]`) · `tags` (`string`|`string[]`; `tag` also accepted) ·
`persistent` (bool — survives purge, restartable) · `bindToDelay` (bool — `this` = the
delay inside callbacks) · `startOnCreate` (bool; defaults true when a callback **and** a
duration are supplied).

**`ManagedDelay`** — control: `start(loopTimes?)`, `pause()`, `resume()`, `stop()`,
`triggerNow(overrideArgs?)`. Chainable config (`return this`): `setOnLoop`, `setOnComplete`,
`setArgs`, `setTime`, `setFrames`, `setLoops`, `addTag`, `clearTags`, `setPersistent`,
`bindToSelf`. Getters: `getTime`, `getTimeLeft`, `getFrames`, `getFramesLeft`, `isWaiting`,
`isRunning`, `isPaused`, `getLoopsLeft`, `getCurrentLoop`, `getTotalLoops`. Props: `.id`,
`.tags`, `.persistent`, `.completed`, `.purged`. Purged delays can't restart — use
`persistent: true` if you plan to reuse one.

---

## 6. Managers

Path root: `D:\Nextcloud\Projects\Reference\lens-studio-core\Managers\`.
All disabled by default in the prefab — enable per project.

### GlobalUtils.js -> builds `global.utils`

Inputs: `advancedOptions` -> per-module load toggles
`loadArrayUtils / loadAsyncUtils / loadColorUtils / loadComponentUtils / loadMathUtils /
loadObjectUtils / loadRandomUtils / loadSceneUtils / loadScreenUtils / loadStringUtils`
(all default `true`). See §1 for merge behaviour.

### GlobalEvents.js -> `global.events`  (needs `global.CallbackTracker` first)

| Signature | |
|---|---|
| `global.events.add(key, fn) -> void` | |
| `global.events.remove(key, fn) -> void` | |
| `global.events.trigger(key, data?) -> void` | fires JS + behavior callbacks |

### TouchBlocking.js -> wraps `global.touchSystem`  (inspector-only, no API)

Inputs: `enableTouchBlocking` (bool) · `exceptions` (bool) -> per-type re-allow toggles
`TouchTypeSwipe / TouchTypeTouch / TouchTypeTap / TouchTypeDoubleTap / TouchTypeScale /
TouchTypePan / TouchTypeNone`. Sets `global.touchSystem.touchBlocking` and calls
`enableTouchBlockingException("TouchType…", bool)` for each.

### TextLogger.js -> `global.textLogger` (+ `global.logToScreen`, `global.logError`)

Inputs: `loggingEnabled=true` · `logLimit=20` · `logTopToBottom=false` ·
`textComponent` (Component.Text; falls back to a Text on the same object) ·
`useUniqueLayer` -> `camera` (renders the log on a `LayerSet.makeUnique()` layer).

| Method | |
|---|---|
| `global.textLogger.addLog(msg)` / `global.logToScreen(msg)` | append |
| `global.textLogger.addErrorLog(msg)` / `global.logError(msg)` | append + switch colour to red until cleared |
| `setLoggingEnabled(bool)` · `setTextColor(vec4)` · `setLogLimit(n)` · `clear()` · `clearError()` | |

Quirk: `AudioManager` calls a non-existent `global.textLogger.log(...)` in its debug path,
so its on-screen debug is a no-op (console `print()` still works).

### AudioManager.js -> `global.audioManager`  (class, built at file scope)

Inputs: `audioTracks` — array of a custom struct:
`trackName`(label "Name") · `track` (Asset.AudioTrackAsset) · `volume=1.0` · `advanced` ->
`loop=false` · `fadeIn=false` · `fadeInTime=1.0` · `fadeOut=false` · `fadeOutTime=1.0` ·
`allowConcurrent=true` · `allowOverwrite=false`. Plus `printDebugStatements`,
`printWarningStatements`.

| Signature | Notes |
|---|---|
| `play(name|name[], options?|onCompleteFn, onComplete?) -> AudioComponent|AudioComponent[]|null` | `null` if the call was delayed |
| `stop(name|name[], options?) -> AudioComponent[]|null` | cancels that track's pending delayed plays immediately |
| `pause(name|name[], options?) -> AudioComponent[]|null` | also cancels pending delays |
| `resume(name|name[], options?) -> AudioComponent[]|null` | |
| `isPlaying(name) -> bool` | |
| `addTracks(cfg|cfg[]) -> void` | register at runtime (same field names as the inspector struct) |
| `removeTracks(name|name[]) -> void` | destroys that track's AudioComponents |

`options`: `delay` · `loop` · `volume` · `fadeInTime` · `fadeOutTime` · `allowConcurrent` ·
`allowOverwrite` · `onStart(comp)` · `onComplete(comp)`. Passing a bare function as the 2nd
arg = `onComplete` shorthand. For a multi-name call, `onStart`/`onComplete` fire for the
**first** name only.

Concurrency: `allowConcurrent:true` -> per-track AudioComponent pool grows on demand.
`allowConcurrent:false` + `allowOverwrite:false` -> skip if already playing.
`allowConcurrent:false` + `allowOverwrite:true` -> stop & restart. A paused component is
always reused.

### SpawnManager.js -> `global.spawn`  (built at file scope)

Inputs: `editAdvancedOptions` -> `printDebugStatements`, `printWarningStatements`.

| Signature | Notes |
|---|---|
| `create(source, parent, group?) -> entry|null` | `source` = `Asset.ObjectPrefab` **or** a **disabled** SceneObject template |
| `createAsync(prefab, parent, cb(entry|null), group?, onProgress?(0..1)) -> void` | prefab only |
| `get(id) -> entry|null` | |
| `getGroup(name) -> entry[]` · `getAll() -> entry[]` | skip already-destroyed |
| `count(name?) -> number` | |
| `destroy(id) -> bool` | calls `entry.script.onDespawn()` first |
| `destroyGroup(name) -> number` · `destroyAll() -> number` | |
| `cleanup() -> number` | prune entries whose objects were destroyed elsewhere |

`entry = { id, obj, transform, group|null, script|null }`.
`id` = `spawn_<ts36>_<rand>_<counter>`; the spawned object is renamed `"<name>_<id>"`.
If the object (root or an immediate child) has a script with `isSpawnable`, SpawnManager
sets its `spawnId`/`spawnGroup`/`spawnManager`, calls `onSpawned()` after spawn and
`onDespawn()` before destroy.

---

## 7. Components

Path root: `D:\Nextcloud\Projects\Reference\lens-studio-core\Components\`.
Attach per-object via the inspector. `//@input`s below list the load-bearing ones only —
open the file for the full set, labels, hints and `showIf` wiring.

### BaseScript.js — TEMPLATE, not a runtime component

The copy-first skeleton for new scripts. See §3.1.

### General

#### CameraSwitcher.js  (`Components\CameraSwitcher.js`)
Front/back camera switch handler. Inputs: `frontCameraObjects[]`, `backCameraObjects[]`,
`editEventCallbacks` -> per-side callback config (`0 None / 1 Global / 2 Custom`).
Binds `CameraFrontEvent`/`CameraBackEvent`; toggles the two object arrays; maintains
`global.isFrontCamera` / `global.isBackCamera`. No `script.*` API.

#### LookAt.js  (`Components\LookAt.js`)
Orient an object toward a target. Inputs: `target` (defaults to `global.MainCamera` or a
found camera), `mode` `"lookAt"|"lookAtDir"|"billboard"`, `constrainAxis` (billboard),
`up`, `space` `"world"|"local"`, `offsetRotation` (vec3 deg), `flipFacingDir`,
`enableSmoothing`+`smoothingSpeed=5`, `runOnStart=true`, `runOnUpdate=true`.
API: `script.lookAt(instant?)` · `script.start()` · `script.stop()` ·
`script.setTarget(sceneObject)`.

#### SmoothFollow.js  (`Components\SmoothFollow.js`)
Follow another object's position/rotation with smoothing. Inputs: `attachTo`,
`followPosition=true`+`smoothPosition=true`+`positionSpeed=5`,
`followRotation=false`+`smoothRotation=true`+`rotationSpeed=5`, `runOnStart`, `runOnUpdate`.
API: `script.update(instant?)` · `script.start(reset?)` · `script.stop()` ·
`script.reset()` · `script.setTarget(sceneObject)`.

#### ScreenToWorld.js  (`Components\ScreenToWorld.js`)
Place an object at a screen coord projected to world space. Inputs:
`screenPosition` (vec2 `0..1`, (0,0)=top-left) · `worldDepth=100` · `camera?` (auto-finds a
perspective camera) · `enableSmoothing`+`smoothingSpeed=5` · `runOnStart` · `runOnUpdate`.
API: `script.setScreenPosition(vec2, instant?)` · `script.setWorldDepth(n, instant?)` ·
`script.setPosition(vec2, depth, instant?)` · `script.update(instant?)` · `script.start()`
· `script.stop()`.

#### ScreenWiggle.js  (`Components\ScreenWiggle.js`)
Sinusoidal bob + tilt on one or many ScreenTransforms (aspect-corrected, per-target
randomised). Inputs: `screenTransforms[]` (Extra Targets; falls back to the ScreenTransform
on this object) · `camera?` · Vertical/Horizontal/Rotation groups (each: `enable*` +
`bobSpeed*` + `bobAmount*` + `speedVariation*` + `amountVariation*`) · `randomizeOnStart=true`
· `runOnStart=true`.
API: `script.start()` · `script.stop()` · `script.reset()` · `script.randomize()`.

#### FPScounter.js  (`Components\FPScounter.js`)
Inputs: `text` (Component.Text) · `smoothing=0.75` (slider 0–0.95). Writes `"FPS: N"` each
frame. No API. (No header block.)

#### EnableOnStart.js  (`Components\EnableOnStart.js`)  — README name: "EnableObjectsOnStart"
Inputs: `objectsToEnable[]` (SceneObject) · `componentsToEnable[]` (Component) · `delay=0`.
Enables all on `OnStartEvent` (after `delay` if > 0). No API.

#### MakeMatUnique.js  (`Components\MakeMatUnique.js`)
No inputs. On init, clones materials on every RenderMeshVisual / Image / Text3D on the
object. No API. (Function version: `global.utils.makeMatUnique`.)

### Buttons  (`Components\Buttons\`)

Shared: local `EventDispatcher` (`.add`/`.remove`/`.trigger`); `callbackType`
`0 None / 1 Global Function / 2 Custom Function`; auto-creates an `InteractionComponent`;
needs an `Image` component; tab-indented; `printDebug`/`printWarning`.

#### PushButton.js
Inputs: `interactable=true` · `pressed=false` · `buttonID=0` · `moreOptions` ->
`pressOnStart`+`delayTime`, event-callback group, `scaleOnPress`+`pressedScale=0.9`,
`colorOnPress`+`defaultColor`+`pressedColor`, `useAudio`+`tapAudioTrack`, `useHaptics`,
advanced -> `touchBlockingEnabled=false` + print flags.
Events: `script.onPress(buttonID, data)` · `script.onPressDown(buttonID)` ·
`script.onPressUp(buttonID)`.
API: `script.press()` · `script.setInteractable(bool)` · `script.isInteractable() -> bool`
· `script.isPressed() -> bool` · `script.getButtonID() -> int`.

#### ToggleButton.js
Inputs: `interactable=true` · `selected=false` · `buttonID=0` · `activeTexture` ·
`inactiveTexture` · `moreOptions` -> `selectOnStart`+`delayTime`, On Select / On Deselect
callback groups, `scaleOnPress`+`pressedScale`, `useAudio`+`selectAudioTrack`+
`deselectAudioTrack`, `useHaptics`, advanced -> `touchBlockingEnabled` + print flags.
Events: `script.onSelect(buttonID, data)` · `script.onDeselect(buttonID, data)` ·
`script.onPressDown` · `script.onPressUp`.
API: `script.select()` · `script.deselect()` · `script.setInteractable(bool)` ·
`script.isSelected() -> bool` · `script.isInteractable() -> bool` ·
`script.getButtonID() -> int` · `script.registerArray(arrayScript)` (called by ButtonArray).

#### ButtonArray.js  (attach to the parent of the ToggleButtons)
Inputs: `connectButtons=true` -> `manualButtons[]` (ScriptComponent — if empty, searches
direct children) · `allowMultiple=false` · `allowNone=false` · `forceSelect=true` (when
`!allowNone`) · `overrideEventCallbacks` -> callback group · advanced -> print flags.
Event: `script.onSelect(buttonID, buttonData, arrayData)`.
API: `script.getButtons() -> ScriptComponent[]` · `script.getButtonByID(id) ->
ScriptComponent|null` · `script.getSelectedButtons() -> ScriptComponent[]` ·
`script.getSelectedButton() -> first|null` · `script.selectButtonByID(id)` ·
`script.deselectButtonByID(id)`.
Internal (used by child buttons): `onChildButtonSelected(id)`,
`onChildButtonCallback(id, data)`, `hasCallbackOverride()`, `allowNoneSelected()`,
`allowMultipleSelected()`, `hasOtherSelected(excludeId)`. Init is deferred one frame via
`DelayedCallbackEvent.reset(0)`.

### Games  (`Components\Games\`)

#### Timer.js  — chainable config (`return script`)
Inputs: `maxTime=10` · `tickInterval=1` · `countdown=true` · `format="ss"` ·
`wholeSecondsMode=false` · `textComponents[]` (Text) · `text3DComponents[]` (Text3D) ·
advanced -> print flags.
Config: `setMaxTime(s)` · `setStartTime(s)` · `setTickInterval(s)` (min 0.01) ·
`setCountdown(bool)` · `setFormat(str)` · `setWholeSecondsMode(bool)` ·
`addTextComp(comp|comp[])` · `clearTextComps()` · `setOnTick(fn(time, formatted))` ·
`setOnComplete(fn(time, formatted))`.
Control: `start(onComplete?)` · `pause()` · `resume()` · `stop()` · `reset()`.
State: `getTime() -> number` · `getFormattedTime() -> string` · `isRunning() -> bool`.
Format tokens: `h`/`hh` `m`/`mm` `s`/`ss` `S`(tenths) `SS` `SSS`. With no `h`/`m` token the
`s`/`ss` slot shows **total** seconds. `wholeSecondsMode` (countdown, no sub-second token)
uses `Math.ceil` so each value shows a full tick.

#### Score.js  — chainable
Inputs: `prefix` · `suffix` · `padding=0` · `minScore=0` · `useMaxScore`+`maxScore=100` ·
`multiplier=1.0` · `textComponents[]` · `text3DComponents[]` ·
`enableHighScoreTracking`+`highScoreStorageKey="highScore"`+`highScoreTextComponents[]`+
`highScoreText3DComponents[]` · advanced -> print flags.
Config: `setPrefix` · `setSuffix` · `setPadding` · `setMinScore` · `setMaxScore` (`null` =
unlimited) · `setMultiplier` · `addTextComp` · `clearTextComps` · `addHighScoreTextComp` ·
`clearHighScoreTextComps` · `setOnChange(fn(score, formatted))` ·
`setOnNewHighScore(fn(score, formatted))`.
Score: `setScore(v)` · `getScore()` · `increment(amount=1)` (×`multiplier`) ·
`decrement(amount=1)` (no multiplier) · `reset()` · `getFormattedScore()` ·
`getMultiplier()` · `resetMultiplier()`.
High score: `enableHighScore(key?)` · `disableHighScore()` · `getHighScore()` ·
`getFormattedHighScore()` · `resetHighScore()` · `isNewHighScore()` — persists via
`global.persistentStorageSystem.store` (`putInt`/`getInt`).

#### SwipeDetector.js
Inputs: `detectionEnabled=true` · `maxSwipeTime=0.5` · `minSwipeDistance=0.1` ·
`enableCallbacks` -> `callbackType` **`0 Global Function / 1 Custom Script`** + per-event
name inputs · advanced -> `touchBlockingEnabled`, `trackUpdates=true`, `enableLogging`.
Events (payload objects):
`script.onSwipeStart` `{ touchPos, time }` ·
`script.onSwipeUpdate` `{ startPos, currentPos, direction, distance, elapsed }` ·
`script.onSwipeEnd` `{ startPos, endPos, direction, distance, duration, speed, isValid }`.
API: `script.setEnabled(bool)` · `script.isEnabled()` · `script.isSwiping()` ·
`script.resetSwipe()`.

#### HeadTiltDetector.js
Inputs: `head` (Component.Head) · `detectionEnabled=true` · thresholds
(`activationThreshold=0.2`, `commitThreshold=0.3`, `neutralZone=0.1`) · timing
(`holdDuration=0.2`, `cooldownDuration=0.25`) · responsiveness (`smoothingFactor=0.4`,
`velocityInfluence=0.5`, `quickTiltMultiplier=1.3`) · `enableCallbacks` -> `callbackType`
`0 Global Function / 1 Custom Script` + names · advanced -> `trackUpdates=true`,
`enableLogging`.
Events:
`script.onTiltUpdate` `{ raw, smoothed, normalized(-1..1), velocity, pendingDirection(-1|0|1),
confidence(0..1), isInCooldown }` ·
`script.onTiltDecision` `{ isRight, direction(-1|1), confidence }`.
API: `script.setEnabled(bool)` · `script.isEnabled()` · `script.getSmoothedTilt()` ·
`script.getRawTilt()` · `script.getPendingDirection()` · `script.getConfidence()` ·
`script.resetState()`. Signal source = `head` object's `transform.up.x`.

### GPU Particles  (`Components\GPU Particles\GPUParticlesController.js`)

Runtime control of a GPU-particles material (drives `mainPass.externalTimeInput`, randomises
`externalSeed`, toggles the RenderMeshVisual). Registers into `global.GPUParticles`.
Inputs: `startOnInit=true` · `useUniqueSeeds=true` · `makeUniqueMaterial=true` ·
`overrideParticleCount=false`+`particleCount=1000` · advanced -> `particleName`
(registry key; defaults to the SceneObject name) + print flags.
Local API: `script.start(delayOn?, delayOff?)` · `script.stop()` · `script.reset()` ·
`script.toggle()` · `script.isRunning() -> bool`.
Global: `global.GPUParticles.start(nameOrSceneObject, delayOn?, delayOff?)` · `.stop(id)` ·
`.reset(id)` · `.toggle(id)` · `.isRunning(id) -> bool|bool[]` (id may be a registry name
or a SceneObject; multiple controllers can share a name).

### Spawnable  (`Components\Spawnable\`)  — use with `global.spawn` (§6)

#### SpawnableBase.js  — copy-and-modify template
Markers: `script.isSpawnable=true; script.spawnId/spawnGroup/spawnManager=null`.
Inputs: `debug` · `debugName="Spawnable"` · `debugText`.
Override: `script.onSpawned = fn` · `script.onDespawn = fn`.
Provided: `script.despawn()` · `script.despawnAfter(seconds)` · `script.getId()` ·
`script.getGroup()` · `script.getObject()`.

#### Popup.js  — ready-made spawnable (fade in -> slide -> fade out -> self-despawn)
Inputs: `is3D` (off = ScreenTransform/screen-space; on = Transform/world-space) ·
`textures[]` (random pick per spawn) · `fadeInTime=0.1` · `fadeOutTime=0.1` ·
`slideTime=0.5` · `slideDistance=0.25` · `trajectoryX={-1,1}` · `trajectoryY={0,1}` ·
`trajectoryZ={0,0}` (3D only) · debug trio.
API: `script.animate(startPos)` — `startPos` is a **vec2 in `-1..1`** when `is3D` is off,
a **vec3 world position** when on. Also carries `script.despawn()` / `getId()` / `getGroup()`
/ `getObject()` and the spawnable markers (no `despawnAfter`). Self-despawns after fade-out.
Uses `global.simpleTween` + `global.easing`.

### Carousel  (`Components\Carousel\`)

#### CarouselElement.js  (marker `script.isCarouselElement=true`; also carries the spawnable markers)
Per-element visual controller driven by the parent each frame.
Inputs: Scale group (`enableScaling=true`, `centerScale=1.0`, `edgeScale=0.7`,
`scaleDistance=2.0`, `easeScale=true`) · Opacity group (`enableOpacity`, `centerOpacity`,
`edgeOpacity`, `opacityDistance`, `easeOpacity`) · Rotation group (`enableRotation=false`,
`maxRotation=30`, `rotationDistance=1.0`) · Render Order group (`enableRenderOrder=false`,
`baseRenderOrder=0`, `renderOrderRange=10`) · Custom Visuals (`enableCustomVisuals`,
`customVisualScript`, `customFunctionName="onDistanceUpdate"`) · advanced
(`screenTransform?`, `imageComponent?`, `makeMaterialUnique=true`) · `enableLogging`.
Called by parent: `script.updateDistanceFromCenter(normalized, raw, isCenter)`.
API: `script.setTexture(tex)` · `script.getNormalizedDistance()` · `script.getRawDistance()`
· `script.isCurrentlyCenter()` · `script.setScale(factor)` · `script.setOpacity(alpha)` ·
`script.getBaseScale() -> vec2`.
Custom-visual fn signature: `fn(normalized, raw, isCenter, sceneObject)`.

#### LinearCarousel.js
Inputs: `startingIndex=0` · `spacing=0.3` · `direction` `"horizontal"|"vertical"` ·
`animationSpeed=8.0` · `spawnedCarousel=false` -> (`elementTemplate`, `spawnParent`,
`textures[]`) **or** (`elements[]`) · `dragArea?` · `swipeSensitivity=2.0` ·
`enableTapToSelect=true`+`interactionCutoff=2.5` · `wrapBuffer=0.0` · `enableCallbacks` ->
`callbackType` `0 Global Function / 1 Custom Script` + `onSelectGlobalFunction` /
(`customScript`+`onSelectFunction`) + `callbackOnStart=true` · `selectAudioTrack?` ·
`enableLogging`.
API: `script.getSelectedIndex()` · `script.getElement(i) -> { obj, script,
screenTransform, interaction, index }` · `script.getElements()` · `script.getElementCount()`
· `script.selectElement(index, animate=true)` · `script.next()` · `script.previous()`.
Callback fn signature: `fn(index, elementObj)`. Spawned mode needs `global.spawn`;
`global.easing` is optional (element easing).

### Fader  (`Components\Fader\Fader.js`)  — `global.faderManager` + per-instance API

Defines `Fader`, `FaderManager`, `Animation`. The first Fader in the scene creates
`global.faderManager`. Modes: **fade** (`baseColor` alpha; opt recursive; text also fades
outline + dropshadow), **scale**, **slide** (ScreenTransform anchors), **move** (position,
offset from start by default).

Inputs: `initialState` `"visible"|"hidden"` · `autoShow`+`autoShowDelay=0` ·
`autoHide`+`autoHideDelay=2.0` · **In** group + **Out** group (each: `mode`, `time`,
advanced -> target value per mode `Alpha`/`Scale`(vec3)/`Rect`(vec4 = left,right,bottom,top)/
`Position`(vec3), `easing` `Linear|Quadratic|Cubic|Quartic|Quintic|Sinusoidal|Exponential|
Circular|Elastic|Back|Bounce`, `easingType` `In|Out|InOut`, `recursiveFade`,
`fadeMaterialParameter="baseColor"`, `scaleLocal`/`positionLocal` `World|Local`) ·
optional group -> `sceneObject?` (target another object) · `faderName?` · `faderTags[]` ·
`disableWhenHidden=false` · `makeMaterialsUnique=false` · `applyMoveAsOffset=true` ·
debug -> print flags.

`global.faderManager`:
| Signature | |
|---|---|
| `show(identifier, animOptions?|onCompleteFn, onComplete?) -> void` | |
| `hide(identifier, animOptions?|onCompleteFn, onComplete?) -> void` | |
| `toggle(identifier, animOptions?|onCompleteFn, onComplete?) -> void` | |
| `stop(identifier) -> void` | |
| `setAlpha(identifier, alpha) -> void` | instant |
| `add(fader)` / `remove(fader)` | (instances self-register on init) |

`identifier`: fader name (string; defaults to the SceneObject name) · tag (string) ·
SceneObject · array of any of those · `null` = all. On a multi-match, `onComplete` fires
once (from the first).
`animOptions`: `time` (default = the mode's `inTime`/`outTime`; `0` = instant) · `delay=0` ·
`mode` (override) · `cancel` `"all"`(default)`|"active"|"none"` · `onStart` · `onComplete`.

Per-instance (`var f = sceneObj.getComponent("Component.ScriptComponent")`):
`f.show(animOptions?, onComplete?)` · `f.hide(...)` · `f.toggle(...)` · `f.stop()` ·
`f.setAlpha(a)` · `f.setScale(scale, local?)` · `f.setRect(vec4)` ·
`f.setPosition(pos, local?)` · `f.isVisible() -> bool` · `f.isAnimating() -> bool` ·
`f.isDestroyed() -> bool` · `f.refreshCache()` (after adding/removing components at runtime).

Notes: needs `global.easing` loaded (easing names are mapped to `global.easing.*`
internally). `fadeMaterialParameter:"particles"` sets all GPU-particle alpha params
together (hotfix). `disableWhenHidden` on the script's **own** object self-locks (it warns)
— point `sceneObject` at a child instead.

---

## 8. Extending Core

- **New script:** copy `Components\BaseScript.js` (§3.1), add the header block (§3.3), keep
  the `debug`/`debugName`/`debugText` inputs + `debugPrint` helper.
- **New utility:** add `Utilities\MyUtils.js` ending with the dual-mode footer (§1), then in
  `Managers\GlobalUtils.js` add a `tryRequire("../Utilities/MyUtils.js")` line (and a
  matching `loadMyUtils` toggle if following the pattern). Functions then appear on
  `global.utils`.
- **New spawnable:** start from `Components\Spawnable\SpawnableBase.js`; keep the
  `isSpawnable` marker block and the `onSpawned`/`onDespawn`/`despawn` methods.
- **Release flow:** bump the file's `Version:`; run
  `python D:\Nextcloud\Projects\Reference\lens-studio-core\sync_to_template.py` (copies
  `Classes\ Components\ Managers\ Utilities\` `**/*.js`, skipping `Example\` and `Cache\`,
  into `Core Template\Assets\Core\`); export `Core.lspkg` from the `Core Template` LS
  project; commit as `Export Core vX.Y.Z` and tag `vX.Y.Z`.

---

## 9. Source file index

All paths under `D:\Nextcloud\Projects\Reference\lens-studio-core\`.

| File | Role |
|---|---|
| `Classes\CallbackTracker.js` | callback registry; engine under `global.events` |
| `Classes\DelayManager.js` | `global.Delay` / `global.DelayManager` / `global.stopDelays` + `ManagedDelay` |
| `Managers\GlobalUtils.js` | builds `global.utils` from the Utilities modules |
| `Managers\GlobalEvents.js` | `global.events` (`.add/.remove/.trigger`) |
| `Managers\TouchBlocking.js` | inspector wrapper over `global.touchSystem` blocking |
| `Managers\TextLogger.js` | `global.textLogger` / `global.logToScreen` / `global.logError` |
| `Managers\AudioManager.js` | `global.audioManager` — named-track playback with pooling/fade/delay |
| `Managers\SpawnManager.js` | `global.spawn` — prefab/template spawning + registry |
| `Utilities\MathUtils.js` | lerp/clamp/remap/quat helpers |
| `Utilities\ArrayUtils.js` | array clone/filter/shuffle/max |
| `Utilities\RandomUtils.js` | random range/vec/quat + distributed generator |
| `Utilities\ColorUtils.js` | RGB/HSV/hex conversions, random colours |
| `Utilities\ObjectUtils.js` | `setDefault` |
| `Utilities\SceneUtils.js` | scene search/traverse/enable/recursive alpha |
| `Utilities\ScreenUtils.js` | ScreenTransform <-> screen-space + rect collision |
| `Utilities\ComponentUtils.js` | alpha get/set + make-material-unique |
| `Utilities\StringUtils.js` | similarity, randomId, chunkText, typeWrite |
| `Utilities\Easing.js` | `global.easing` — 31 easing curves |
| `Utilities\SimpleTween.js` | `global.simpleTween` — linear value tween |
| `Utilities\BaseTools.js` | `global.BaseTools(script)` — delay/loop/audio helpers on `script` |
| `Utilities\AsyncUtils.js` | `global.AsyncBaseTools(script)` — promise delay/tween helpers |
| `Components\BaseScript.js` | new-script template (see §3.1) |
| `Components\CameraSwitcher.js` | front/back camera object toggling + `global.isFrontCamera` |
| `Components\LookAt.js` | orient toward target (lookAt / lookAtDir / billboard) |
| `Components\SmoothFollow.js` | smoothed position/rotation follow |
| `Components\ScreenToWorld.js` | screen coord -> world position placement |
| `Components\ScreenWiggle.js` | sinusoidal bob/tilt on ScreenTransform(s) |
| `Components\FPScounter.js` | on-screen smoothed FPS |
| `Components\EnableOnStart.js` | enable objects/components on lens start (opt delay) |
| `Components\MakeMatUnique.js` | clone all materials on the object at init |
| `Components\Buttons\PushButton.js` | tap button, press feedback, callbacks |
| `Components\Buttons\ToggleButton.js` | stateful on/off button |
| `Components\Buttons\ButtonArray.js` | radio / multi-select group of ToggleButtons |
| `Components\Games\Timer.js` | countdown/countup timer with formatting + callbacks |
| `Components\Games\Score.js` | score tracking + multiplier + persistent high score |
| `Components\Games\SwipeDetector.js` | swipe start/update/end events with validation |
| `Components\Games\HeadTiltDetector.js` | left/right head-tilt decision detection |
| `Components\GPU Particles\GPUParticlesController.js` | runtime start/stop/reset of GPU particles + `global.GPUParticles` |
| `Components\Spawnable\SpawnableBase.js` | spawnable template (lifecycle + self-manage) |
| `Components\Spawnable\Popup.js` | animated self-despawning popup (2D/3D) |
| `Components\Carousel\CarouselElement.js` | per-element distance-based visuals |
| `Components\Carousel\LinearCarousel.js` | drag/snap carousel controller |
| `Components\Fader\Fader.js` | fade/scale/slide/move visibility system + `global.faderManager` |
