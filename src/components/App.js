/**
 * App.js - Main application controller
 * ES module version
 */

import { GlobeContainer } from './GlobeContainer.js';
import { BottomSheet } from './BottomSheet.js';
import { initializeBottomSheet } from '../utils/bottom-sheet.js';
import { detectOSPreference, applyTheme, subscribeToOSPreferenceChange } from '../utils/themeManager.js';

const THEME_STORAGE_KEY = 'mapapp-theme';

function getStoredTheme() {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch (error) {
    return null;
  }
}

function persistTheme(theme) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    // Ignore storage errors
  }
}

function getInitialThemeState() {
  const stored = getStoredTheme();
  if (stored) {
    return { value: stored, source: 'user' };
  }
  return { value: detectOSPreference(), source: 'system' };
}

/**
 * App Component
 *
 * RESPONSIBILITY:
 * - Global state management (projects, selection, narrative, theme)
 * - Component orchestration (Globe + Bottom Sheet)
 * - Unified layout: full-screen globe + draggable bottom control sheet
 *
 * STATE:
 * - projects: All project data loaded from JSON
 * - selectedProject: Currently focused project (or null)
 * - narrativeIndex: Which intro passage is active
 * - currentTheme: Active theme (light, dark, zen, story)
 *
 * CHILDREN:
 * - GlobeContainer (main viewport)
 * - BottomSheet (unified control center with filters & projects)
 */
export function App() {
  const { useState, useEffect, useMemo, useRef } = React;
  const initialThemeState = useMemo(() => getInitialThemeState(), []);

  // State
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTheme, setCurrentTheme] = useState(initialThemeState.value);
  const [themeSource, setThemeSource] = useState(initialThemeState.source);
  const [satelliteView, setSatelliteView] = useState(false);

  // Router from global scope (loaded as plain script)
  const Router = window.MapAppUtils && window.MapAppUtils.Router;

  const projectMap = useMemo(() => {
    const map = new Map();
    projects.forEach(project => {
      if (project && project.id) {
        map.set(project.id, project);
      }
    });
    return map;
  }, [projects]);

  const routeSubscriptionRef = useRef(null);

  // Load project data
  useEffect(() => {
    fetch('./data/projects.json')
      .then(response => response.json())
      .then(data => {
        setProjects(data);
        setLoading(false);
      })
      .catch(error => {
        setProjects([]);
        setLoading(false);
      });
  }, []);

  // Keep selected project in sync with hash routing
  useEffect(() => {
    if (!Router) return;
    if (projects.length === 0) return;

    if (routeSubscriptionRef.current) {
      routeSubscriptionRef.current();
      routeSubscriptionRef.current = null;
    }

    const cleanup = Router.onHashChange((route) => {
      if (route.route === 'project' && route.projectId && projectMap.has(route.projectId)) {
        const nextProject = projectMap.get(route.projectId);
        setSelectedProject(prev => (prev && prev.id === nextProject.id) ? prev : nextProject);
      } else if (route.route === 'home') {
        setSelectedProject(prev => (prev ? null : prev));
      } else {
        setSelectedProject(prev => (prev ? null : prev));
      }
    });

    routeSubscriptionRef.current = cleanup;

    return () => {
      if (routeSubscriptionRef.current) {
        routeSubscriptionRef.current();
        routeSubscriptionRef.current = null;
      }
    };
  }, [Router, projects.length, projectMap]);

  // Push selection updates to hash
  useEffect(() => {
    if (!Router) return;
    const currentRoute = Router.parseHash();
    if (selectedProject && selectedProject.id) {
      if (currentRoute.route !== 'project' || currentRoute.projectId !== selectedProject.id) {
        Router.navigateToProject(selectedProject.id);
      }
    } else if (currentRoute.route !== 'home') {
      Router.navigateHome();
    }
  }, [Router, selectedProject]);

  // Initialize bottom sheet drag functionality
  useEffect(() => {
    const timer = setTimeout(() => {
      initializeBottomSheet();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Event Handlers
  function handleSelectProject(project) {
    if (!project) {
      setSelectedProject(null);
      return;
    }
    setSelectedProject(project);
  }

  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    if (themeSource !== 'system') {
      persistTheme(currentTheme);
    }
  }, [currentTheme, themeSource]);

  useEffect(() => {
    if (themeSource !== 'system') return;
    const unsubscribe = subscribeToOSPreferenceChange((nextPreference) => {
      setCurrentTheme(nextPreference);
    });
    return unsubscribe;
  }, [themeSource]);

  function handleSelectTheme(themeId) {
    setThemeSource('user');
    setCurrentTheme(themeId);
  }

  function handleToggleSatelliteView() {
    setSatelliteView(prev => !prev);
  }

  function handleShare() {
    if (window.MapAppUtils && window.MapAppUtils.Share) {
      window.MapAppUtils.Share.shareProject(selectedProject);
    }
  }

  // Loading state
  if (loading) {
    return React.createElement('main',
      { className: 'app-container' },
      React.createElement('p', null, 'Loading 3D Globe...')
    );
  }

  // Main render - Globe + Bottom control sheet
  return React.createElement('main',
    { className: 'app-container' },

    // Left: Globe
    React.createElement(GlobeContainer, {
      projects,
      selectedProject: selectedProject,
      onProjectClick: handleSelectProject,
      onGlobeReady: () => {},
      theme: currentTheme,
      satelliteView
    }),

    // Bottom: Unified control center (themes, filters, projects, detail view)
    React.createElement(BottomSheet, {
      projects,
      onSelectProject: handleSelectProject,
      selectedProjectId: selectedProject ? selectedProject.id : null,
      onSelectTheme: handleSelectTheme,
      currentTheme: currentTheme,
      satelliteView,
      onToggleSatelliteView: handleToggleSatelliteView,
      onShare: handleShare
    })
  );
}
