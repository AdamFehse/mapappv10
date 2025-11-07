/**
 * main.js - Application entry point
 * Modern ES modules - no build step needed
 */

// Import main components (ES modules)
import { App } from './components/App.js';
import { NarrativeBar } from './components/NarrativeBar.js';
import { RightPanel } from './components/RightPanel.js';
import { GlobeContainer } from './components/GlobeContainer.js';
import { MarkerManager } from './components/globe/MarkerManager.js';

// Register components in window.MapApp namespace for React usage
window.MapApp = window.MapApp || {};
window.MapApp.App = App;
window.MapApp.NarrativeBar = NarrativeBar;
window.MapApp.RightPanel = RightPanel;
window.MapApp.GlobeContainer = GlobeContainer;
window.MapApp.MarkerManager = MarkerManager;

// Initialize app once DOM is ready
function initializeApp() {
  // Check if all required components are loaded
  if (
    !window.MapApp?.App ||
    !window.MapApp?.GlobeContainer ||
    !window.MapApp?.RightPanel ||
    !window.CesiumConfig ||
    !window.Cesium
  ) {
    // Not ready yet, retry
    setTimeout(initializeApp, 50);
    return;
  }

  // All dependencies loaded - render app
  console.log('Initializing MapApp V10');
  ReactDOM.createRoot(document.getElementById('root')).render(
    React.createElement(window.MapApp.App)
  );
}

// Start initialization after DOM ready
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
