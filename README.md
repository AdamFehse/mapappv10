# MapApp V10 - 3D Globe Story Map

Interactive 3D globe for exploring Arizona-Sonora borderlands research and art projects.

## Features
- **3D Globe** - Cesium-powered terrain visualization
- **Narrative Intro** - Cinematic onboarding before markers appear
- **Right Panel** - Pico-styled search, filters, and detail view
- **Accessible** - Keyboard navigation, screen reader support
- **Theme-able** - Pico CSS with dark/light mode
- **No Build Required** - Pure CDN, works anywhere

## Tech Stack
- **Cesium.js** - 3D globe rendering
- **React 18** - Component architecture via CDN builds
- **Pico CSS** - Minimal, semantic styling
- **Vanilla JS utilities** - Hash routing + accessibility helpers
- **No Node/npm required** - All libraries from CDN

## Quick Start

### 1. Prepare Your Data
Update `data/projects.json` with the projects you want displayed (an example dataset ships in this repo).

### 2. Serve Locally
You need a web server (file:// won't work due to CORS).

**Option A: Python**
```bash
python -m http.server 8000
# Visit: http://localhost:8000
```

**Option B: PHP**
```bash
php -S localhost:8000
```

**Option C: VS Code Live Server**
- Install "Live Server" extension
- Right-click `index.html` → "Open with Live Server"

### 3. Open in Browser
Navigate to `http://localhost:8000`

## Project Structure

```
mapappv10/
├── index.html              # Entry point
├── ARCHITECTURE.md         # Detailed architecture docs
├── README.md               # This file
│
├── components/             # React components (CDN-based)
│   ├── App.js              # Main app controller
│   ├── GlobeContainer.js   # Cesium 3D globe + intro narrative
│   └── RightPanel.js       # Searchable/ filterable project list & detail
│
├── config/
│   └── cesium-config.js    # Globe settings
│
├── styles/                 # Pico CSS overrides
│   ├── theme.css           # Color palette, layout variables
│   ├── globe.css           # Cesium-specific
│   └── rightpanel.css      # Project panel UI
│
├── utils/
│   ├── routing.js          # Hash-based routing
│   └── accessibility.js    # A11y helpers
│
└── data/
    └── projects.json       # Project data (copy from v7)
```

## Development Phases

This project is scaffolded with **stubs and TODOs** for iterative development.

### Phase 1: Foundation ✅ (COMPLETE)
- [x] File structure
- [x] Architecture document
- [x] Component stubs with clear interfaces
- [x] CDN setup in index.html
- [x] Pico CSS theme configuration

### Phase 2: Globe Core ✅
- [x] Initialize Cesium viewer
- [x] Set camera to Arizona-Sonora border
- [x] Add project markers to verify rendering
- [x] Handle marker click events

### Phase 3: Data Integration ✅
- [x] Load `data/projects.json`
- [x] Create billboard for each project
- [x] Handle large datasets gracefully
- [x] Keep globe + panel selections in sync

### Phase 4: Right Panel ✅
- [x] Render searchable/filterable project list
- [x] Provide cinematic narrative gating
- [x] Wire selection to globe flyTo
- [x] Show per-project detail view inside panel

### Phase 5: Panel Polish (TODO)
- [ ] Highlight the active card when globe selection changes
- [ ] Add optional media gallery when data includes assets
- [ ] Deep-link directly into a project via hash routing
- [ ] Provide share/shareable copy for project metadata

### Phase 6: Polish (TODO)
- [ ] Keyboard navigation testing
- [ ] Screen reader testing
- [ ] Performance optimization
- [ ] Mobile responsive adjustments

### Phase 7: Future Enhancements
- [ ] FloatingCard component (Option C from research)
- [ ] Clustering for dense markers
- [ ] Advanced filtering (date ranges, multiple categories)
- [ ] Share/permalink functionality

## How to Contribute (For Engineers)

Each component has clear TODOs and responsibilities documented in comments.

### Finding Work
1. Open `ARCHITECTURE.md` to understand the system
2. Pick a component (e.g., `GlobeContainer.js`)
3. Search for `TODO:` comments
4. Implement one TODO at a time
5. Test in browser

### Key Files to Read First
1. **ARCHITECTURE.md** - Complete system overview
2. **components/App.js** - State management flow
3. **config/cesium-config.js** - Globe configuration
4. **styles/theme.css** - Theming system

### Testing Changes
1. Save file
2. Refresh browser (no build step!)
3. Check browser console for errors
4. Test keyboard navigation (Tab, Enter, Esc)

## Theming

All colors/styles controlled via **Pico CSS custom properties** in `styles/theme.css`.

### Change Primary Color
```css
:root {
  --pico-primary: #YOUR_COLOR;
}
```

### Adjust Sidebar Width
```css
:root {
  --sidebar-width: 500px; /* Default: 420px */
}
```

### Dark Mode
Automatic based on system preference. Override:
```css
[data-theme="dark"] {
  --globe-accent: #YOUR_DARK_COLOR;
}
```

## Browser Requirements
- **Modern browser** (Chrome, Firefox, Safari, Edge)
- **WebGL support** (for Cesium 3D rendering)
- **JavaScript enabled**

## Accessibility Features
- Keyboard navigation (Tab, Enter, Esc, Arrow keys)
- Screen reader support (ARIA labels)
- `prefers-reduced-motion` respected
- High contrast mode compatible
- Focus indicators on all interactive elements

## Known Limitations
- **No offline support** (requires CDN access)
- **Cesium API key** may be needed for terrain (free tier available)
- **Large datasets** (>1000 projects) may need clustering

## Resources
- **Cesium Docs**: https://cesium.com/learn/cesiumjs-learn/
- **Pico CSS Docs**: https://picocss.com/docs
- **React Docs**: https://react.dev

## License
MIT (inherits from mapappV7)

## Questions?
See `ARCHITECTURE.md` for detailed component specifications.
