// cesium-config.js - Cesium viewer configuration
window.CesiumConfig = {
  // Camera initial position (Arizona-Sonora borderlands)
  camera: {
    center: {
      lat: 31.5,    // Latitude (degrees)
      lon: -110.5,  // Longitude (degrees)
      alt: 500000   // Altitude (meters above ground)
    },
    heading: 0,     // Compass direction (0 = north)
    pitch: -45,     // Tilt angle (degrees, negative = looking down)
    roll: 0         // Rotation (usually 0)
  },

  // Cesium Viewer widget options
  // See: https://cesium.com/learn/cesiumjs/ref-doc/Viewer.html
  viewerOptions: {
    animation: false,           // Bottom-left timeline animation widget
    timeline: false,            // Bottom timeline scrubber
    baseLayerPicker: true,      // Top-right imagery selector
    geocoder: false,            // Top-right search box
    homeButton: true,           // Top-right home button
    sceneModePicker: true,      // Allow users to switch 2D/3D
    navigationHelpButton: false,// Hide help button (cleaner UI)
    fullscreenButton: true,     // Enable fullscreen toggle
    vrButton: false,            // VR mode toggle

    // Imagery provider options:
    // - 'ION_WORLD_IMAGERY' (default) -> Cesium Ion World Imagery (assetId: 2)
    // - 'ION_ASSET' -> Use a specific Cesium Ion imagery asset (set ionAssetId below)
    imageryProvider: 'ION_ASSET',
    // If imageryProvider is 'ION_ASSET', set your Ion asset ID here (e.g., Earth at Night / Black Marble)
    // Example: ionAssetId: 3812
    ionAssetId: 3812,

    // Terrain (3D elevation)
    terrainProvider: 'CESIUM_WORLD_TERRAIN', // or null for flat globe

    // Lighting & Time (optional)
    // enableLighting darkens the night side of the globe based on the current time
    enableLighting: false,
    // Set an initial time (UTC) to bias lighting (e.g., '2024-06-21T04:00:00Z')
    initialTimeIso: null,

    // Night imagery (Black Marble) options
    // Set to true to replace base imagery with Black Marble (ion asset 3812 by default)
    nightAsBase: false,
    // Or add as a semi-transparent overlay
    addNightOverlay: false,
    nightAssetId: 3812, // Cesium ion "Black Marble" asset id
    nightOverlayAlpha: 0.85,

    // Performance
    requestRenderMode: true,    // Only render when needed (saves battery)
    maximumRenderTimeChange: Infinity // Disable FPS throttling
  },

  // Marker/Billboard styling
  markers: {
    defaultColor: '#2196F3',   // Blue
    selectedColor: '#FF5722',  // Orange-red
    hoverColor: '#1976D2',     // Dark blue
    size: 32,                  // Billboard size (pixels)
    clusteringEnabled: true,   // Group nearby markers
    clusterRadius: 80          // Pixels to group within
  },

  // Camera animation settings
  animation: {
    duration: 2.0,             // Seconds for flyTo animations
    easingFunction: 'QUADRATIC_IN_OUT' // Smooth acceleration/deceleration
  },

  // Accessibility
  accessibility: {
    reducedMotion: false      // Will be updated from prefers-reduced-motion
  }
};

// Detect user's motion preference
if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  window.CesiumConfig.accessibility.reducedMotion = true;
  window.CesiumConfig.animation.duration = 0; // Instant transitions
  console.log('Reduced motion enabled');
}
