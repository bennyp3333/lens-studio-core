# Buttons

Interactive button components for building UI elements in Lens Studio. These scripts provide standard button behaviors with visual feedback, audio support, and flexible callback systems.

## Overview

The button system consists of three main components that work together or independently:

- **PushButton** - Standard press-and-release buttons
- **ToggleButton** - Buttons with persistent on/off states
- **ButtonArray** - Manages groups of ToggleButtons with coordinated behavior

All button components support multiple callback methods and include built-in features like press animations, audio feedback, and debug logging.

## Components

### PushButton.js

A standard button that triggers an action when tapped, with optional press feedback.

**Basic Setup:**
1. Attach to a Scene Object with an Image component
2. Configure visual feedback (scale, color changes)
3. Set up callbacks via Inspector or script

**Key Features:**
- Scale-on-press animation
- Color tinting on press
- Audio feedback
- Optional auto-press on start
- Button ID for identification in callbacks

**Visual Feedback Options:**
- **Scale on Press** - Shrinks button when touched
- **Color on Press** - Tints button color while pressed

### ToggleButton.js

A stateful button that switches between selected and deselected states, maintaining its state until pressed again.

**Basic Setup:**
1. Attach to a Scene Object with an Image component
2. Assign Active and Inactive textures
3. Configure callbacks and behavior

**Key Features:**
- Persistent selected/deselected state
- Separate textures for active/inactive states
- Separate callbacks for select and deselect events
- Can be part of a ButtonArray for coordinated behavior
- Optional auto-select on start

**Textures Required:**
- **Active Texture** - Displayed when button is selected
- **Inactive Texture** - Displayed when button is deselected

### ButtonArray.js

Manages groups of ToggleButtons to create radio button groups, multi-select lists, or other coordinated button behaviors.

**Basic Setup:**
1. Create a parent Scene Object
2. Add ToggleButton components to child objects
3. Attach ButtonArray script to the parent
4. Configure selection rules

**Manual Button Registration (optional):**
- Drag button Script Components into the **Manual Buttons** array in the Inspector
- When populated, the array is used instead of searching child objects
- Useful when buttons are not direct children of the ButtonArray object

**Selection Modes:**

**Radio Button Mode** (default):
- Only one button can be selected at a time
- Selecting a button automatically deselects others
- At least one button must be selected

**Multi-Select Mode:**
- Multiple buttons can be selected simultaneously
- Enable with "Allow Multiple" option

**Optional Selection Mode:**
- Can have zero buttons selected
- Enable with "Allow None" option
- Works with both radio and multi-select modes

**Key Features:**
- Automatic button registration from children (or manual override via Inspector)
- Centralized callback management
- Get selected button(s) programmatically
- Select/deselect buttons by ID
- Override individual button callbacks

## Callback Systems

All button components support multiple ways to handle button presses:

### 1. Inspector Configuration (Recommended)

Configure callbacks directly in the Inspector for quick setup:

**Global Function:**
- Calls a function defined in global scope
- Pass button ID and custom data as arguments

**Custom Function:**
- Calls a function on another Script Component
- Reference the target script and function name

This is the fastest method for most use cases and keeps configuration visible in the Inspector.

### 2. Programmatic API

Add callbacks via script for more complex or dynamic behavior:

**PushButton:**
```javasccript
var pushBtn = script.getSceneObject().getComponent("Component.ScriptComponent");
pushBtn.onPress.add(function(buttonID, data) {
    print("Button " + buttonID + " pressed!");
});
```

**ToggleButton:**
```javasccript
var toggleBtn = script.getSceneObject().getComponent("Component.ScriptComponent");

toggleBtn.onSelect.add(function(buttonID, data) {
    print("Button " + buttonID + " selected!");
});

toggleBtn.onDeselect.add(function(buttonID, data) {
    print("Button " + buttonID + " deselected!");
});
```

**ButtonArray:**
```javasccript
var buttonArray = script.getSceneObject().getComponent("Component.ScriptComponent");

buttonArray.onSelect.add(function(buttonID, buttonData, arrayData) {
    print("Button " + buttonID + " selected in array!");
});
```

## Common Patterns

### Simple Menu Buttons

Use PushButton for straightforward actions:
```javascript
// Configure in Inspector or add via script:
var menuBtn = script.getSceneObject().getComponent("Component.ScriptComponent");
menuBtn.onPress.add(function(buttonID) {
    if(buttonID === 0) {
        // Start game
    } else if(buttonID === 1) {
        // Open settings
    }
});
```

### Settings Toggle

Use ToggleButton for on/off settings:
```javascript
var soundToggle = script.getSceneObject().getComponent("Component.ScriptComponent");
soundToggle.onSelect.add(function() {
    global.audioEnabled = true;
});
soundToggle.onDeselect.add(function() {
    global.audioEnabled = false;
});
```

### Radio Button Group

Use ButtonArray with ToggleButtons for exclusive selection:
```javascript
// ButtonArray automatically handles exclusive selection
// Just enable child ToggleButtons and set unique IDs
var difficultyArray = script.getSceneObject().getComponent("Component.ScriptComponent");
difficultyArray.onSelect.add(function(buttonID) {
    if(buttonID === 0) global.difficulty = "easy";
    else if(buttonID === 1) global.difficulty = "medium";
    else if(buttonID === 2) global.difficulty = "hard";
});
```

### Multi-Select List

Use ButtonArray with multiple selection enabled:
```javascript
// Enable "Allow Multiple" in ButtonArray Inspector
var filterArray = script.getSceneObject().getComponent("Component.ScriptComponent");
filterArray.onSelect.add(function(buttonID) {
    print("Filter " + buttonID + " enabled");
    updateFilters();
});
```

## Button Properties

### Shared Properties (All Buttons)

- **Interactable** - Whether button responds to touch
- **Button ID** - Numeric identifier passed to callbacks
- **Audio** - Optional audio feedback on press/select
- **Debug Logging** - Enable console and TextLogger output
- **Touch Blocking** - Whether touch events block other UI elements

### PushButton Specific

- **Press on Start** - Automatically trigger press after delay
- **Scale on Press** - Shrink animation while pressed
- **Color on Press** - Tint color while pressed

### ToggleButton Specific

- **Selected** - Initial selected state
- **Active/Inactive Textures** - Visuals for each state
- **Select on Start** - Automatically select after delay
- **Scale on Press** - Shrink animation on tap

### ButtonArray Specific

- **Manual Buttons** - Optional array of button Script Components; when set, skips automatic child search
- **Allow Multiple** - Enable multi-select mode
- **Allow None** - Permit zero selected buttons
- **Force Select** - Auto-select first button if none selected
- **Override Event Callbacks** - Centralize callbacks at array level

## Programmatic Control

### PushButton API
```javascript
script.press()                    // Trigger press programmatically
script.setInteractable(false)     // Disable button
script.isInteractable()           // Check if enabled
script.isPressed()                // Check if currently pressed down
script.getButtonID()              // Get button ID
```

### ToggleButton API
```javascript
script.select()                   // Select the button
script.deselect()                 // Deselect the button
script.isSelected()               // Check if selected
script.setInteractable(false)     // Disable button
script.getButtonID()              // Get button ID
script.registerArray(arrayScript) // Register with ButtonArray (automatic)
```

### ButtonArray API
```javascript
script.getButtons()               // Get array of all button scripts
script.getButtonByID(buttonID)    // Get specific button script
script.getSelectedButtons()       // Get array of selected buttons
script.getSelectedButton()        // Get first selected button
script.selectButtonByID(buttonID) // Select button programmatically
script.deselectButtonByID(buttonID) // Deselect button programmatically
```

## Integration with Core

All button components integrate with Core systems:

- **TextLogger** - Debug output appears on screen when enabled
- **Global Events** - Can trigger `global.events` in callbacks
- **Delay Manager** - Use `global.Delay()` in callback functions
- **Audio System** - Built-in audio component creation and playback

## Best Practices

- **Use Button IDs** - Assign unique IDs to identify buttons in callbacks
- **Inspector Configuration** - Use Inspector setup for most cases, it's faster
- **Programmatic for Dynamic** - Use script API when you need runtime flexibility
- **ButtonArray for Groups** - Let ButtonArray manage toggle button coordination
- **Debug During Development** - Enable debug logging to track button behavior
- **Audio Feedback** - Add audio for better user experience
- **Touch Blocking** - Keep enabled for most UI scenarios

## Examples

Check the "Example Project" folder in the Buttons directory for working demonstrations of:
- Individual button setups
- ButtonArray configurations
- Callback implementations
- Common UI patterns