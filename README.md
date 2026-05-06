# Gardener

A drag-and-drop canvas tool for quickly creating UI layout mockups. Export the structure as human-readable text for AI to implement.

## Quick Start

Open `index.html` in a browser. No build tools or dependencies required.

## Features

- **Drag & Drop** — Drag elements from the left palette onto the canvas
- **Nesting** — Drop elements inside containers (View, ScrollView, Button)
- **Resize** — 8-handle resize on selected elements
- **Snap & Guides** — Edge/center alignment with 5px snap threshold
- **Properties Panel** — Edit position, size, colors, text, opacity on the right
- **Undo/Redo** — `Ctrl+Z` / `Ctrl+Shift+Z`
- **Delete** — `Delete` or `Backspace` key
- **Canvas Presets** — iPhone SE, iPhone 14, iPad, Desktop, Custom

## Supported Elements

| Element | Description |
|---------|-------------|
| View | Generic container, supports nesting |
| Image | Image with optional source URL |
| Text | Text label with font styling |
| Button | Styled button with text |
| Input | Input field placeholder |
| ScrollView | Scrollable container |

## Export Format

Click **Export to Clipboard** to copy a tree-structured text representation:

```
Canvas 390x844
  View (x:0, y:0, w:390, h:200, bg:#f0f0f0, radius:12, opacity:1)
    Image (x:16, y:16, w:358, h:168, src:"hero.png")
    Text "Hello" (x:16, y:50, w:200, h:30, font:24, weight:bold, color:#333)
  Button (x:16, y:220, w:358, h:44, bg:#007AFF, radius:8)
    Text "Submit" (font:16, color:#fff, align:center)
```

This format is designed to be fed to any AI model to generate code (web, mobile, etc.).

## Project Structure

```
├── index.html          # Entry point
├── css/style.css       # Styles
└── js/
    ├── app.js          # Main init
    ├── state.js        # Global state + event system
    ├── history.js      # Undo/redo stack
    ├── canvas.js       # Canvas rendering
    ├── drag.js         # Drag from palette + move elements
    ├── select.js       # Selection + resize + properties panel
    ├── snap.js         # Alignment guides + snapping
    └── export.js       # Export to clipboard
```
