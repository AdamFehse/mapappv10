# Separate CSS Files - Narrative Bar vs Explorer Bar

## Overview
CSS files have been separated so you can work on **narrative bar** and **explorer bar** independently.

## File Structure

### **Narrative Bar** (`styles/narrative-bar.css`)
Controls the hero section when in narrative mode:
- `.narrative-bar` - Container
- `.hero-*` - Hero section content (title, description, meta)
- `.hero-progress-*` - Progress dots
- `.narrative-progress-*` - Progress bar
- `.narrative-empty` - Empty state

**Location in App:**
- Right panel when `showNarrativeIntro = true`
- Full-screen hero with background image, overlay, text, and progress indicators

### **Explorer Bar** (`styles/explorer-bar.css`)
Controls the right panel projects/explorer view:
- `.right-panel` - Container
- `.panel-toolbar` - Top toolbar with mode label
- `.panel-edge-tab` - Collapse/expand button
- `.panel-projects-*` - Project listing view
- `.project-detail-*` - Expanded project detail view
- `.detail-*` - Detail view content (image, title, meta, sections, badges)

**Location in App:**
- Right panel when `showNarrativeIntro = false`
- Projects list or expanded project detail view

## Index.html Updated

Both files are now linked separately:

```html
<link rel="stylesheet" href="./styles/reset.css" />
<link rel="stylesheet" href="./styles/theme.css" />
<link rel="stylesheet" href="./styles/globe.css" />
<link rel="stylesheet" href="./styles/narrative-bar.css" />
<link rel="stylesheet" href="./styles/explorer-bar.css" />
```

## Files Created/Modified

| File | Status | Note |
|------|--------|------|
| `styles/explorer-bar.css` | ✅ Created | New file with all right panel/explorer styles |
| `styles/narrative-bar.css` | ✅ Existing | Already separate, no changes needed |
| `index.html` | ✅ Updated | Now links to both files instead of rightpanel.css |
| `styles/rightpanel.css` | ✅ Deleted | Removed - was duplicate of explorer-bar.css |

## Why Separate?

**Before:**
- Single `rightpanel.css` contained both narrative bar AND explorer bar styles
- Hard to work on one without affecting the other
- Mixed concerns (hero section vs project list)

**After:**
- `narrative-bar.css` - ONLY narrative/hero styles
- `explorer-bar.css` - ONLY projects/explorer/detail view styles
- Independent development and testing
- Clearer organization and maintenance

## Development Tips

### Working on Narrative Bar?
Edit: `styles/narrative-bar.css` and `components/NarrativeBar.js`

### Working on Explorer Bar?
Edit: `styles/explorer-bar.css` and `components/RightPanel.js`

### Adding a new feature?
1. Determine if it's narrative or explorer related
2. Edit the appropriate CSS file
3. Update the component file
4. Test in both dark and light mode

## No Functionality Changes

This is a **pure refactoring** - no visible changes to the app:
- Same HTML structure
- Same styles applied
- Same responsive behavior
- Same dark/light mode support

All theme variables work in both files through the shared `theme.css` ✅

## Next Steps

You can now safely:
- ✅ Modify narrative bar colors, spacing, typography
- ✅ Modify explorer bar layout, cards, detail view
- ✅ Add new styles without worrying about conflicts
- ✅ `rightpanel.css` has been deleted (was redundant)
