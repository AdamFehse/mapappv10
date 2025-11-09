# Bottom Sheet Integration Guide

## What Was Created

I've created a mobile-friendly draggable bottom sheet with:
- **Drag handle** at the bottom (appears as a subtle bar)
- **Theme selector** with Light, Dark, Zen, Story options
- **Control buttons** for Share and Show/Hide Projects
- **Drag-to-expand** gesture (drag up) and drag-to-collapse (drag down)
- **Click overlay** to close when expanded

## Files Created

1. **`styles/bottom-sheet.css`** - All styling for the bottom sheet
2. **`src/utils/bottom-sheet.js`** - Drag/swipe gesture handler
3. **`src/components/BottomSheet.js`** - React component

## Integration Steps

### Step 1: Import BottomSheet in App.js

```javascript
import { BottomSheet } from './BottomSheet.js';
import { initializeBottomSheet } from '../utils/bottom-sheet.js';
```

### Step 2: Add Theme State to App.js

In the `App()` function, add this state after other useState declarations:

```javascript
const [currentTheme, setCurrentTheme] = useState('light');

function handleSelectTheme(themeId) {
  setCurrentTheme(themeId);
  // Update the HTML element with theme class
  const root = document.documentElement;
  root.className = themeId === 'light' ? '' : `theme-${themeId}`;
}
```

### Step 3: Add Share Handler

Add this to App.js:

```javascript
function handleShare() {
  if (window.MapAppUtils && window.MapAppUtils.Share) {
    window.MapAppUtils.Share.shareProject(selectedProject);
  }
}
```

### Step 4: Add BottomSheet to Render

Add this to the App render, **before** the closing tag:

```javascript
React.createElement(BottomSheet, {
  onToggleSidebar: handleToggleSidebar,
  isSidebarOpen: isSidebarOpen,
  onSelectTheme: handleSelectTheme,
  currentTheme: currentTheme,
  onShare: handleShare
})
```

### Step 5: Initialize Drag Handler

Add this in App.js `useEffect` after components load:

```javascript
useEffect(() => {
  // Initialize bottom sheet drag functionality after a short delay
  // to ensure DOM is ready
  const timer = setTimeout(() => {
    initializeBottomSheet();
  }, 100);

  return () => clearTimeout(timer);
}, []);
```

### Step 6: Hide Old Controls (Optional)

To hide the old floating sidebar toggle button and map theme selector:

**Option A: CSS** (in `globe.css` or `right-panel.css`):
```css
.panel-toggle-tab {
  display: none;
}

.map-styles-row {
  display: none;
}
```

**Option B: React** (in components, add conditional rendering)

## How It Works

### Desktop Behavior
- Bottom sheet stays minimally visible as a small drag handle
- User can click the handle or drag to expand
- Share button and theme selector appear in the sheet
- Sidebar toggle controlled from sheet

### Mobile Behavior
- Same draggable bottom sheet
- Touch gestures for drag/swipe
- Optimized layout for smaller screens
- Overlay appears when expanded for better UX

### Gesture Controls
- **Drag up** from handle - expand
- **Drag down** from sheet - collapse
- **Click handle** - toggle expand/collapse
- **Click overlay** - close sheet
- **Swipe threshold** - 50px to trigger action

## Customization

### Change Drag Threshold
Edit `src/utils/bottom-sheet.js`, line 19:
```javascript
const DRAG_THRESHOLD = 50; // Change this value
```

### Change Max Height
Edit `src/utils/bottom-sheet.js`, line 21:
```javascript
const maxHeight = window.innerHeight * 0.7; // 70% of viewport
```

### Style Customization
All colors use CSS variables from `theme-variables.css`, so they respect the current theme automatically.

Edit `styles/bottom-sheet.css` to adjust:
- Padding
- Gap between elements
- Border styles
- Shadow intensity

## Testing Checklist

- [ ] Bottom sheet appears at bottom of screen
- [ ] Drag handle is visible and grabbable
- [ ] Dragging up expands the sheet
- [ ] Dragging down collapses the sheet
- [ ] Click handle toggles expand/collapse
- [ ] Theme buttons change the active theme
- [ ] Share button works
- [ ] Show/Hide Projects button toggles sidebar
- [ ] All colors change with theme
- [ ] Mobile responsive on smaller screens
- [ ] Overlay appears when expanded

## Notes

- The bottom sheet uses CSS custom properties for theming, so colors will automatically match the selected theme
- Touch events use `{ passive: true }` for better performance
- The sheet respects `prefers-reduced-motion` for accessibility
- All buttons are keyboard accessible (Tab navigation)
