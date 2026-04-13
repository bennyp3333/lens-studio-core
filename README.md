# Lens Studio Core

A comprehensive utility package for Snap Lens Studio projects, providing reusable scripts, managers, and components to accelerate development and establish best practices for your lenses.

## What is Lens Studio Core?

Lens Studio Core is a foundational package designed to be added at the start of any Lens Studio project. It provides a curated collection of utility functions, manager systems, and ready-to-use components that handle common tasks and patterns in lens development.

## Quick Start

1. **Import the Package**: Add `Core.lspkg` to your Assets panel in Lens Studio
2. **Add the Prefab**: Drag `Core.prefab` into the top of your Objects panel hierarchy
3. **Start Building**: Access utilities, events, and managers throughout your project

> **Note**: Manager scripts are disabled in the scene hierarchy by default to avoid performance overhead. Enable the specific manager scripts you need (TouchBlocking, AudioManager, GlobalEvents, DelayManager, SpawnManager, Utilities, TextLogger) by checking them in the Core prefab hierarchy.

## What's Included

### 📦 Core Systems (Auto-configured via Prefab)

The Core prefab automatically sets up essential systems:

- **TouchBlocking**: Block native Snapchat gestures and configure per-type exceptions
- **AudioManager**: Global audio playback for named tracks with pooling, fade, and delay support
- **GlobalEvents**: Event management system for decoupled communication between scripts
- **DelayManager**: Handle delayed callbacks and time-based operations
- **SpawnManager**: Spawn and manage objects from prefabs or scene templates
- **Utilities**: Global access to all utility modules (Math, Array, Color, String, etc.)
- **TextLogger**: Visual debugging with on-screen text logging

See [Managers/](./Managers/) for detailed documentation.

### 🧩 Components

Ready-to-use script components you can attach to scene objects:

- **Buttons**: Interactive button systems (Push, Toggle, Button Arrays)
- **Camera**: Camera utilities (CameraSwitcher, LookAt, SmoothFollow)
- **Particles**: GPU particle system controllers
- **Misc**: FPS counter, object enablers, and more

See [Components/](./Components/) for component-specific documentation and examples.

### 🛠️ Utilities

Comprehensive utility modules for common operations:

- Math operations and helpers
- Array manipulation
- Color conversions and utilities
- String formatting
- Random number generation
- Scene object queries
- Component helpers
- Easing functions and tweening

See [Utilities/](./Utilities/) for detailed API documentation.

### 🏗️ Classes

Reusable class definitions for advanced functionality:

- **CallbackTracker**: Manage and track callback lifecycles
- **DelayManager**: Timer and delayed execution system

See [Classes/](./Classes/) for class documentation.

## Project Structure

**lens-studio-core/**
- **Classes/** - Reusable class definitions
- **Components/** - Scene components with examples
- **Core Example/** - Example project
- **Managers/** - Global manager systems
- **Shaders/** - Reuable shaders and subgraphs
- **Utilities/** - Utility function libraries
- **Core.lspkg** - Importable package

## Why Use Lens Studio Core?

- **Faster Development**: Stop rewriting common utilities and patterns
- **Best Practices**: Built-in patterns for events, timing, and object management
- **Consistent API**: Familiar utilities across all your projects
- **Well-Tested**: Battle-tested code used in production lenses
- **Extensible**: Easy to build upon and customize for your needs

## Getting Help

Each folder contains its own README with detailed documentation on the specific utilities, components, or systems it contains. Check those out for API references, usage examples, and best practices.