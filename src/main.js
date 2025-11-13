/**
 * main.js - Application entry point
 * ES modules - no build step
 */

import { App } from './components/App.js';
import { GlobeContainer } from './components/GlobeContainer.js';
import { MarkerManager } from './components/globe/MarkerManager.js';

// Register components in window.MapApp namespace
window.MapApp = window.MapApp || {};
window.MapApp.App = App;
window.MapApp.GlobeContainer = GlobeContainer;
window.MapApp.MarkerManager = MarkerManager;

// Render app
ReactDOM.createRoot(document.getElementById('root')).render(
  React.createElement(App)
);
