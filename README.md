# Gardener

A drag-and-drop canvas tool for quickly creating UI layout mockups. Export the structure as human-readable text for AI to implement.

## Quick Start

Open `index.html` in a browser. No build tools or dependencies required.

## Features

- **Drag & Drop** — Drag elements from the left palette onto the canvas
- **Nesting** — Drop elements inside containers (View, ScrollView)
- **Resize** — 8-handle resize on selected elements
- **Snap & Guides** — Edge/center alignment snapping with visual guides
- **Properties Panel** — Edit position, size, background, radius, opacity, text, and more on the right
- **Name Labels** — Every element has an editable name; shown in the layer tree and export output
- **Undo/Redo** — `Cmd/Ctrl+Z` / `Cmd/Ctrl+Shift+Z`
- **Delete** — `Delete` or `Backspace` key
- **Canvas Presets** — iPhone 17, Desktop, or Custom size; switching prompts confirmation and resets the canvas
- **Device Chrome** — iPhone 17 canvas shows rounded corners and Dynamic Island overlay
- **Safe Area Presets** — iPhone 17 canvas auto-populates Status Bar and Bottom Safe Area views

## Supported Elements

| Element | Description |
|---------|-------------|
| View | Generic container, supports nesting |
| Image | Image with optional source URL |
| Text | Text label with font styling and optional background |
| Button | Styled button with text |
| Input | Input field placeholder |
| ScrollView | Scrollable container (vertical / horizontal / all) |

## Export Format

Click **Export** to copy a tree-structured text representation:

```
Canvas 393x852
  Status Bar [View] (x:0, y:0, w:393, h:59, bg:#e8dede, radius:0, opacity:1)
  Bottom Safe Area [View] (x:0, y:818, w:393, h:34, bg:#dce6da, radius:0, opacity:1)
  View (x:16, y:80, w:361, h:200, bg:#d8e2ea, radius:12, opacity:1)
    Text "Hello" (x:12, y:12, w:200, h:30, font:24, weight:bold, color:#333333)
  Button "Sign In" (x:16, y:760, w:361, h:44, bg:#4a90c4, radius:8, opacity:1, font:16, weight:bold, color:#f0f4f8, align:center)
```

**Name rules:**
- Custom name → `Name [Type] (...)`
- Default name → `Type (...)` (no bracket duplication)

This format is designed to be fed to any AI model to generate code (SwiftUI, Compose, React, etc.).

## Adding a New Device

1. Add an entry to `js/devices.js`:
   ```js
   iphone16: {
     label: 'iPhone 16 (393×852)',
     width: 393, height: 852,
     cornerRadius: 55,
     dynamicIsland: { width: 126, height: 37, top: 11, borderRadius: 20 },
     safeArea: { statusBarHeight: 59, homeIndicatorHeight: 34 },
   },
   ```
2. Add a matching `<option value="iphone16">` in `index.html`.

## Project Structure

```
├── index.html          # Entry point + right-panel property fields
├── css/style.css       # All styles
└── js/
    ├── devices.js      # Device configs (dimensions, chrome, safe areas)
    ├── app.js          # Init, device switching, preset elements
    ├── state.js        # Global state, element factory, event bus
    ├── history.js      # Undo/redo stack (max 50)
    ├── canvas.js       # Canvas DOM rendering
    ├── drag.js         # Palette drag, element move, nesting
    ├── select.js       # Selection, resize handles, properties panel
    ├── snap.js         # Alignment guides + snapping (absolute coords)
    ├── layers.js       # Layer tree panel
    └── export.js       # Export to clipboard
```
