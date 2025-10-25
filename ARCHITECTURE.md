# MapApp V10 - 3D Globe Story Map
## Product Vision
Immersive 3D globe experience for Arizona-Sonora borderlands research projects with accessible, theme-able UI. Fullscreen globe with slide-in sidebar, potential for floating project cards.

## Tech Stack (All CDN)
- **Cesium.js** - 3D globe/terrain rendering
- **React 18** - Component architecture
- **Pico CSS** - Centralized theming/styling
- **Vanilla utilities** - Hash routing + accessibility helpers
- **No build tools** - Works everywhere (including work PC without Node)

## Core Principles
1. **Modular** - Each component is independent with clear interfaces
2. **Theme-able** - All styling through Pico CSS custom properties
3. **Accessible** - Keyboard nav, ARIA labels, screen reader support
4. **Iterative** - Easy to swap UI patterns (sidebar → floating cards)
5. **Simple** - CDN-based, no build complexity

---

## Component Architecture

### App.js (Main Controller)
**Responsibility:** State management, routing, component orchestration

**State:**
- `projects` - All project data
- `selectedProject` - Currently focused project
- `narrativeIndex` - Intro narration phase (gates panel)
- `loading` - Data loading state

**Child Components:**
- GlobeContainer (left side)
- RightPanel (right side)

**APIs Exposed:**
- `handleSelectProject(project)` - Navigate to project
- `setNarrativeIndex(step)` - Advance intro narrative

---

### GlobeContainer.js (3D Map)
**Responsibility:** Cesium viewer, camera control, project markers

**Props:**
- `projects` - Array of projects to display
- `selectedProject` - Current selection (to focus camera)
- `onProjectClick` - Callback when marker clicked
- `onGlobeReady` - Callback when Cesium loads

**Internal State:**
- `viewer` - Cesium.Viewer instance
- `entities` - Map of project ID → Cesium entity

**Key Methods:**
- `initializeViewer()` - Setup Cesium
- `createMarker(project)` - Add billboard/point to globe
- `flyToProject(project)` - Animate camera to location
- `updateVisibleProjects()` - Track what's in viewport

**Cesium Configuration:**
- Base imagery: Natural Earth / Bing / Mapbox
- Terrain: Cesium World Terrain
- Camera: Centered on Arizona-Sonora border
- Initial view: Tilted 45°, altitude 500km

---

### RightPanel.js (Project Browser)
**Responsibility:** Native-scroll project browser with Pico styling

**Props:**
- `projects` - Full project list (panel handles filtering)
- `onSelectProject` - Callback when card clicked
- `narrativeIndex` - Determines which projects are visible during intro

**Features:**
- Live text search plus category/theme dropdown filters
- Narrative-aware gating (hide cards until the story reaches the borderlands)
- Click-and-drag scrolling with custom momentum
- Inline detail view for expanded project info and media
- Badges for art/music/research/poetry metadata

**Sections:**
- Header, search, and filter controls
- Results count + scrollable card list
- Per-card CTA that opens the expanded detail layout
- "No results" fallback for empty filters

---

## Deleted Components

The following components were removed as part of code cleanup (legacy stubs):
- **Sidebar.js** - Superseded by RightPanel.js
- **SearchBar.js** - Functionality integrated into RightPanel.js
- **ProjectDetail.js** - Not yet fully implemented, future enhancement
- **ProjectCard.js** - Folded directly into RightPanel cards
- **ProjectGallery.js** - Replaced with the streamlined RightPanel experience

---

## Configuration Files

### config/cesium-config.js
```javascript
window.CesiumConfig = {
  camera: {
    center: { lat: 31.5, lon: -110.5 }, // Arizona-Sonora border
    altitude: 500000, // meters
    heading: 0,
    pitch: -45, // degrees (tilt)
    roll: 0
  },
  imagery: 'NATURAL_EARTH', // or 'BING', 'MAPBOX'
  terrain: true,
  animation: false, // Timeline widget
  timeline: false,
  baseLayerPicker: false,
  geocoder: false,
  homeButton: true,
  sceneModePicker: false, // 3D only
  navigationHelpButton: true
};
```

### styles/theme.css
Defines Pico overrides (colors, layout grid, responsive behavior).
```css
:root {
  --pico-primary: #2196F3;
  --pico-primary-hover: #1976D2;
  --globe-accent: var(--pico-primary);
  --globe-hover: var(--pico-primary-hover);
  --globe-selected: #FF5722;
  --sidebar-width: 420px;
}

.app-container {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, var(--sidebar-width));
}

@media (max-width: 1024px) {
  .app-container {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(0, 55vh) minmax(0, 45vh);
  }
}
```

---

## Data Structure

### Project Object (from projects.json)
```javascript
{
  id: "project-1-the-place-where-clouds-are-for",
  ProjectName: "The Place Where Clouds Are Formed",
  ProjectLeads: ["Dr. Ofelia Zepeda", "Gareth Smith", "Martin Zicari"],
  Affiliation: "UA Department of Linguistics, March Water Inc",
  Year: 2022,
  Email: "ofelia@arizona.edu",
  ImageUrl: "https://confluencenter.arizona.edu/sites/default/files/2024-03/4396c0db-638a-8b7c-1082-25d61738ad1e.png",
  ProjectCategory: "Art-Based Projects",
  Theme: "Place and Identity",
  Product: "Collective Art",
  Location: "Tohono O'odham Nation",
  DescriptionShort: "",
  DescriptionLong: "",
  Latitude: 32.222607,
  Longitude: -110.974709,
  Bio: null,
  Artworks: [],
  Music: [],
  Research: [],
  Outcomes: [],
  HasArtwork: true,
  HasMusic: false,
  HasResearch: false,
  HasPoems: false,
  Tags: ["art"]
}
```

**Field Mappings:**
- `ProjectName` - Project title
- `Latitude` / `Longitude` - GPS coordinates (use for globe markers)
- `Location` - Human-readable location (e.g., "Tucson", "Nogales, AZ")
- `ProjectCategory` - Primary category filter (e.g., "Art-Based Projects", "Research Projects", "Education and Community Outreach")
- `Theme` - Thematic tag (e.g., "Place and Identity", "Migration and Human Rights")
- `Product` - Type of output (e.g., "Article", "Photography", "Workshops", "Internship")
- `ProjectLeads` - Array of lead researchers/artists
- `Affiliation` - Host institution
- `ImageUrl` - Single image URL for project thumbnail
- `Year` - Project year
- `Email` - Contact email
- `HasArtwork` / `HasMusic` / `HasResearch` / `HasPoems` - Boolean flags for content type
- `Tags` - Array of tags (e.g., ["art"], ["research"], ["community"])

---

## Routing Strategy

### URL Patterns
- `/` - Home (globe view, no selection)
- `/#project/project-001` - Project selected
- `/#search?q=water` - Search results (future)

### Implementation
- Use `window.location.hash` for routing
- Listen to `hashchange` event
- Update `selectedProject` state on hash change
- Browser back/forward works automatically

---

## Accessibility Requirements

### Keyboard Navigation
- `Tab` - Focus markers, sidebar elements
- `Enter/Space` - Select project
- `Esc` - Close sidebar/deselect
- `Arrow keys` - Navigate list

### Screen Reader Support
- ARIA labels for all interactive elements
- `role="application"` on Cesium viewer
- `aria-live` regions for dynamic updates
- Alt text for all images

### Motion
- Respect `prefers-reduced-motion`
- Disable camera animations if set
- Instant transitions instead of flyTo()

---

## File Structure
```
mapappv10/
├── index.html              # Entry point, CDN links
├── ARCHITECTURE.md         # This file
├── README.md               # Setup & usage instructions
├── components/
│   ├── App.js              # Main controller
│   ├── GlobeContainer.js   # Cesium 3D viewer
│   └── RightPanel.js       # Pico-styled project browser
├── config/
│   └── cesium-config.js    # Map settings
├── styles/
│   ├── theme.css           # Pico overrides & custom properties
│   ├── globe.css           # Cesium-specific styles
│   └── rightpanel.css      # Panel & card styling
├── data/
│   └── projects.json       # Project data
└── utils/
    ├── routing.js          # Hash-based routing helpers
    └── accessibility.js    # A11y utilities
```

---

## Development Phases

### Phase 1: Foundation ✓
- [x] Create file structure
- [x] Write architecture doc
- [x] Stub all components with TODOs
- [x] Index.html with CDN links
- [x] Verify page loads without errors

### Phase 2: Globe Core ✓
- [x] Initialize Cesium viewer with base imagery & terrain
- [x] Set camera to Arizona-Sonora
- [x] Add project markers + click handlers

### Phase 3: Data Integration ✓
- [x] Load `data/projects.json`
- [x] Map markers per project
- [x] Keep selections synced between panel + globe

### Phase 4: Right Panel ✓
- [x] Implement Pico-styled layout
- [x] Render project list with search/filter
- [x] Wire selection to globe flyTo
- [x] Provide inline detail experience

### Phase 5: Panel Polish (Next)
- [ ] Highlight cards when selection comes from globe
- [ ] Deep link into panel via hash routing
- [ ] Optional media gallery for artworks/music
- [ ] Share/download actions

### Phase 6: Polish
- [ ] Keyboard navigation
- [ ] Screen reader testing
- [ ] Performance optimization
- [ ] Mobile responsiveness

### Phase 7: Future (Option C)
- [ ] FloatingCard component
- [ ] Toggle sidebar/floating modes
- [ ] User preference storage

---

## Engineering Notes

### Cesium Performance Tips
- Use billboards (not 3D models) for markers
- Limit entities to ~1000 max
- Cluster markers if > 100 visible
- Disable shadows for performance

### Pico CSS Theming
- Never write custom CSS for layout
- Use Pico's grid system
- Override via CSS custom properties only
- Keep theme.css under 100 lines

### React Patterns
- Use refs for Cesium viewer (not state)
- Debounce search input (300ms)
- Memoize filtered projects
- Use `useCallback` for event handlers

---

## Success Metrics
- Load time < 3s on 3G
- Smooth 60fps camera movement
- Sidebar slide animation < 300ms
- Zero keyboard navigation dead-ends
- Works on work PC without Node
