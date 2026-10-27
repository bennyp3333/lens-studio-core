# Delay Loader

Keeps heavy content out of the scene until after the first frame, to pass Snap's LAT (Latency Activation Time) check. Instantiates prefabs after a frame or time delay, or on demand, and restores the script references that break when content is moved into a prefab.

> **Standalone:** these scripts have no dependencies on the rest of Core, so you can copy them into a project without importing the package. PrefabForwarder and PrefabInjector need DelayLoader.

## Overview

LAT is measured from lens start to the first rendered frame, and ad lenses have to pass it in review. Everything in the scene at that point costs you: shader compilation, mesh upload and texture decode. The fix is to move the heavy parts of the lens into prefabs and instantiate them one frame later, after the clock has stopped.

Moving an object into a prefab removes it from the scene, which breaks every script input that pointed at it. The other two scripts deal with that, so an otherwise finished lens can be optimised late without rewiring it.

The system consists of three scripts:

- **DelayLoader** - Instantiates prefabs after a delay or on demand, through the shared `global.delayLoader`
- **PrefabForwarder** - Sits inside a prefab and exposes the objects and components other scripts need
- **PrefabInjector** - Writes forwarded references into another script's inputs, then enables it, with no changes to that script

> **Important: turn on Lazy Loading for every delay loaded prefab, or this does nothing for LAT.**
>
> By default a prefab's assets load at lens start whether or not it is ever instantiated. Select each prefab in the Asset Browser and set it to **Lazy Load Assets** in the Inspector (serialized as `LazyLoading: true` in the `.prefab` file). It is off on every new prefab.
>
> With Lazy Loading on, the asset load moves into the instantiate call, which blocks while it runs. Tick **Async** on those entries so the load is spread over several frames instead of stalling one.

## Scripts

### [DelayLoader.js](./DelayLoader.js)

Registers prefabs by name and instantiates them under a chosen parent, either automatically after a delay or when you ask for them.

**Basic Setup:**
1. Move the heavy content into a prefab and turn on Lazy Loading for it
2. Add DelayLoader to any SceneObject
3. Add an entry to **Objects**, give it a **Load Name**, and set the prefab and parent
4. Tick **Load On Init** and **Async**

**Key Features:**
- Frame or time delay per entry, or load manually from script
- Async loads through `instantiateAsync`, queued one at a time
- Sticky load events, so subscribing late still calls you back
- `onAllLoaded` once every Load On Init entry has settled
- Unload and reload at runtime
- Any number of DelayLoader components, all sharing one `global.delayLoader`
- Per-load timing in the debug log

### [PrefabForwarder.js](./PrefabForwarder.js)

Lists the objects and components inside a prefab that scripts outside it need. DelayLoader collects them when the prefab loads and hands them out by name.

**Basic Setup:**
1. Add PrefabForwarder to the root object of the prefab
2. Add an entry to **Scene Objects To Forward** or **Components To Forward** for each reference, and give it a **Forward Name**
3. Read it back with `loaded.get(forwardName)`, or map it into a script's input with a PrefabInjector

**Key Features:**
- Forwards SceneObjects and Components of any type
- **Is Array** forwards a whole array under one name
- Several forwarders on one prefab (root plus immediate children) merge into one table

### [PrefabInjector.js](./PrefabInjector.js)

Repairs a script whose inputs broke when their targets moved into a prefab, without editing that script. It waits for the prefab to load, writes the forwarded references into the script's inputs, then enables it.

**Basic Setup:**
1. Untick the broken script's component in the Inspector
2. Add PrefabInjector to any SceneObject (usually the same one)
3. Set **Target Script** to the broken script and **Load Name** to the DelayLoader entry's Load Name
4. Add an **Injections** row per reference: its **Forward Name**, and the **Target Input** it goes into

**Key Features:**
- No changes to the target script, and no ready flags inside it
- Waits on several prefabs if rows pull from different ones with **Load Name Override**
- Leaves the target disabled if any reference is missing, rather than running half wired
- Can enable extra objects and components along with the target

## Getting References Back

A script that used to point at an object now inside a prefab has an empty input. There are two ways to restore it.

| | Manual | PrefabInjector |
|---|---|---|
| Use when | You own the script and are happy to edit it | The script can't or shouldn't be edited |
| Target script | Subscribes to the load and fills its own input | Unchanged, starts disabled |
| Gating | A ready flag in the script | Handled for you, the script only starts once its inputs are filled |

Both need a PrefabForwarder on the prefab listing the references.

### Method 1: Manual

Leave the input empty in the Inspector, fill it from the load event, and gate anything that uses it until it arrives:

```javascript
//@input Component.Text numberText

var ready = false;

function init() {
    global.delayLoader.onLoaded("object1").add(function(loaded) {
        script.numberText = loaded.get("numberText");
        ready = true;
    });
}

function onUpdate() {
    if (!ready) return;
    // ... logic that uses script.numberText ...
}

script.createEvent("OnStartEvent").bind(init);
script.createEvent("UpdateEvent").bind(onUpdate);
```

### Method 2: PrefabInjector

Nothing changes in the script. Configure it in the Inspector instead:

```
Target Script -> CarController            (component unticked)
Load Name     -> "car"
Injections    -> [ wheels -> wheels ] [ wheels -> hints ] [ wiperAnim -> anim ]
                   Forward Name -> Target Input
```

CarController starts up once, with `script.wheels`, `script.hints` and `script.anim` already filled in.

**How it works:**
1. Waits until every prefab its rows depend on has loaded
2. Looks up every row first. If any is missing and **Only Enable If All Succeeded** is on, it stops there and touches nothing
3. Writes each value onto the target script
4. Enables the target, plus any **Objects To Enable** / **Components To Enable**
5. Writes the values again, as a safeguard

A script component that has never been enabled hasn't run its body or fired OnStart. Values written onto it before its first enable survive that enable, so the target reads its inputs exactly as it normally would, at the top of the script or in OnStart.

## Usage

### Loading on Init

Tick **Load On Init** on an entry and choose a delay:

- **frames** - A frame delay of `1` loads on the second update, which is what you want for LAT. `0` loads during OnStartEvent, which defeats the point.
- **time** - Seconds to wait, for staggering loads or holding something back for later.

The prefab is instantiated directly under its parent and keeps the local transform it was authored with. Tick **Reset Transform** to zero it instead.

### Reacting to a Load

```javascript
global.delayLoader.onLoaded("heroModel").add(function(loaded) {
    loaded.root.getTransform().setLocalPosition(new vec3(0, 10, 0));
    loaded.get("heroAnim").playAnimation("idle");
});
```

Load events are sticky. If the object has already loaded, the callback fires straight away with the existing payload, so script order never matters. Pass `true` as the second argument to `add()` to skip that replay.

### Loading Manually

Untick **Load On Init** and load it yourself:

```javascript
global.delayLoader.loadObject("heroModel", function(loaded) {
    if (!loaded) return; // the load failed
    loaded.root.enabled = true;
});

// Or with options, overriding the entry's parent and async setting for this load
global.delayLoader.loadObject("heroModel", {
    parent: otherParent,
    async: true,
    onComplete: function(loaded) {}
});
```

Calling it for an object that is already loaded hands back the existing payload. Calling it while a load is in flight waits on that load.

Names are registered when each DelayLoader wakes, before any OnStartEvent, so another script can call `loadObject` on the very first frame.

### Unloading and Reloading

```javascript
global.delayLoader.unload("heroModel");  // destroys the instance
global.delayLoader.reload("heroModel");  // unload, then load again

global.delayLoader.onUnloaded("heroModel").add(function(payload) {
    print("Unloaded " + payload.name);
});
```

Unloading clears the sticky load event, so a late subscriber isn't handed an object that no longer exists.

### Waiting for Everything

```javascript
global.delayLoader.onAllLoaded.add(function() {
    startExperience();
});
```

Fires once, after every Load On Init entry has loaded or failed. It also fires with no init loads at all. It is sticky, like `onLoaded`.

### Forwarding Arrays

Tick **Is Array** on a PrefabForwarder entry and the single reference field becomes an array field. The whole array comes back under one name, so an array input is restored in one assignment:

```javascript
global.delayLoader.onLoaded("car").add(function(loaded) {
    script.wheels = loaded.get("wheels");
});
```

The forwarded array is a copy. It always keeps its original length, empty slots included, so indices still line up with the Inspector list. An empty array input forwards `[]`.

## Names at a Glance

Three different names tie the scripts together, and all of them show up in the Inspector fields below. Each is set in one place and used elsewhere:

| Name | Set on | Identifies | Used by |
|---|---|---|---|
| **Load Name** | a DelayLoader entry | one prefab to load | `loadObject` / `onLoaded` / `get`, and a PrefabInjector's **Load Name** (or a row's **Load Name Override**) |
| **Forward Name** | a PrefabForwarder entry | one object or component inside that prefab | `loaded.get(...)`, and a PrefabInjector row's **Forward Name** |
| **Target Input** | a PrefabInjector row | one `//@input` on the Target Script | — |

```javascript
// Load Name "car", Forward Name "wheels"
global.delayLoader.onLoaded("car").add(function(loaded) {
    script.wheels = loaded.get("wheels");
});
```

## Inspector Configuration

### DelayLoader

**Objects** - one entry per prefab:

- **Load Name** - Name used to load and look it up from script, and what a PrefabInjector's Load Name refers to. Must be unique across the whole scene
- **Prefab** - The prefab to instantiate
- **Parent** - What to instantiate under. Falls back to the DelayLoader's own object, with a warning
- **Load On Init** - Load automatically after the delay. Default: off
  - **Delay Type** - `frames` or `time`
  - **Frame Delay** - Default: `1`
  - **Time Delay** - Seconds. Default: `0.25`
- **Async** - Use `instantiateAsync` through the queue. Default: off
- **Enable On Load** - Enable the root once instantiated. Default: on
- **Reset Transform** - Zero the root's local transform instead of keeping the authored one. Default: off

**Debug** - Logs scheduling, each load with its duration and forwarded reference count, and failures.

### PrefabForwarder

- **Scene Objects To Forward** - Entries of **Forward Name**, **Is Array**, and **Scene Object** or **Scene Objects**
- **Components To Forward** - Entries of **Forward Name**, **Is Array**, and **Component** or **Components**

Forward Names only need to be unique within the prefab. Entries with a blank Forward Name, or a blank single reference, are skipped with a warning. A duplicate Forward Name warns and the first entry wins.

### PrefabInjector

- **Target Script** - The script component to fill in. Untick it in the Inspector
- **Load Name** - Load Name of the DelayLoader entry the rows pull from
- **Injections** - One row per reference:
  - **Forward Name** - The Forward Name given to the reference on the prefab's PrefabForwarder
  - **Target Input** - The Target Script input to write into, spelled exactly. Leave blank when it matches the Forward Name
  - **Load Name Override** - Pull just this row from a different prefab. Leave blank to use the Load Name above
- **Enable Target** - Enable the target after injecting. Default: on
- **Only Enable If All Succeeded** - If any row can't be resolved, inject nothing and enable nothing. Default: on
- **Objects To Enable** / **Components To Enable** - Enabled along with the target

## The Loaded Payload

Passed to `onLoaded`, `onAnyLoaded`, `onUnloaded` and `loadObject`'s callback:

```javascript
loaded.name              // the entry's Load Name
loaded.root              // the instantiated prefab root
loaded.transform         // its Transform
loaded.parent            // what it was instantiated under
loaded.prefab            // the source prefab asset
loaded.refs              // { forwardName: SceneObject|Component|Array, ... } from PrefabForwarder
loaded.get(forwardName)  // one forwarded reference (or the whole array for an array entry), or null
```

`get()` logs a warning when nothing is forwarded under that Forward Name.

## DelayLoader API

```javascript
// Loading
global.delayLoader.loadObject(loadName, onComplete);  // or (loadName, {parent, async, onComplete})
global.delayLoader.loadAll(onComplete);               // loads every entry not already loaded
global.delayLoader.unload(loadName);                  // destroys the instance, returns bool
global.delayLoader.reload(loadName, onComplete);      // unload then load again

// Querying
global.delayLoader.isLoaded(loadName);                // bool
global.delayLoader.get(loadName);                     // payload, or null
global.delayLoader.getRef(loadName, forwardName);     // forwarded reference, or null
global.delayLoader.getNames();                        // every registered Load Name, in order

// Events - each has .add(callback, skipReplay) and .remove(callback)
global.delayLoader.onLoaded(loadName);                // per object, sticky
global.delayLoader.onUnloaded(loadName);              // per object
global.delayLoader.onAnyLoaded;                       // fires for every load
global.delayLoader.onAllLoaded;                       // fires once, when all init loads settle, sticky
```

Every DelayLoader component also mirrors these onto its own `script` (`script.loadObject`, `script.onLoaded`, and so on). Callbacks are wrapped, so an error in one is printed and the rest still run.

## PrefabForwarder API

```javascript
forwarder.isPrefabForwarder;    // true
forwarder.getForwardedRefs();   // { forwardName: SceneObject|Component|Array, ... }
```

You rarely need these. DelayLoader reads the forwarders for you.

## PrefabInjector API

```javascript
injector.inject();          // inject now, against whatever has loaded, returns { ok, injected, failed }
injector.isInjected();      // bool
injector.onInjected;        // sticky event, fires with { ok, injected, failed }
injector.isPrefabInjector;  // true
```

## Best Practices

- **Lazy Loading on, Async on** - Both, on every heavy prefab
- **Check the Timings** - Turn on Debug and read each load's duration. A heavy prefab reporting ~0ms means Lazy Loading is still off
- **Keep Loaders Local** - Put a DelayLoader next to each heavy part of the lens instead of one giant list. They all share `global.delayLoader`
- **Unique Load Names** - Load Names are scene-wide. A duplicate is ignored with a warning
- **Forward Arrays Whole** - Use Is Array to restore an array input in one assignment instead of naming every element
- **Gate the Target's Object Too** - Enabling a script component does nothing while its SceneObject is disabled. List the object in Objects To Enable if it also needs to wait
- **Free Memory on Unload** - A prefab keeps its assets in memory after unload while **Retain Assets** is ticked (the default). Untick it if you unload to free memory rather than just to clear the screen

## Troubleshooting

**LAT didn't improve:**
- Check Lazy Loading is on for each prefab (`LazyLoading: true` in the `.prefab` file)
- A Frame Delay of `0` loads during OnStart, use `1` or more
- Anything still in the scene at start counts. Check nothing heavy was left outside a prefab

**Frame hitch when a prefab loads:**
- Tick Async on the entry. With Lazy Loading on, a non-async load stalls the frame until its assets are in

**"has no Forward Name …":**
- The PrefabForwarder must be on the prefab root or one of its immediate children
- Forward Names are case sensitive and must match exactly

**Injected script stays disabled:**
- A row couldn't be resolved and Only Enable If All Succeeded is on. Read the log, it names the row
- Check Load Name (and any Load Name Override) matches a DelayLoader entry's Load Name. The injector warns at start if it doesn't

**Injected input is still empty:**
- Check Target Input is spelled exactly like the target's `//@input`. An empty object input reads as `undefined`, the same as a name the script never declared, so a typo can't be detected. It just sets a property nothing reads

**"The target script is already enabled":**
- Untick the target's component in the Inspector. Left enabled, it has already started up against its empty inputs

**Load callback receives `null`:**
- The load failed. Either the Load Name isn't registered (an entry with a blank Load Name or no prefab is skipped at start, with a warning) or the instantiate failed. The reason is in the log. `onLoaded` doesn't fire for a failed load

## Example Project

The [Example](./Example/) folder contains a working demonstration with:
- Two Lazy Loading prefabs loaded async on init under a parent, one frame after lens start
- Method 1, manual: `Example1.js` fills its own input from the load event and gates on a ready flag
- Method 2, PrefabInjector: `Example2.js` is an unmodified script that starts disabled, and a PrefabInjector fills its input and enables it
