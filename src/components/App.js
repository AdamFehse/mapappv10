/**
 * App.js - Main application controller
 * ES module version
 */

import { GlobeContainer } from './GlobeContainer.js';
import { RightPanel } from './RightPanel.js';

/**
 * App Component
 *
 * RESPONSIBILITY:
 * - Global state management (projects, selection, narrative)
 * - Component orchestration (Globe + Right Panel)
 * - Simple 2-column layout
 *
 * STATE:
 * - projects: All project data loaded from JSON
 * - selectedProject: Currently focused project (or null)
 * - narrativeIndex: Which intro passage is active
 *
 * CHILDREN:
 * - GlobeContainer (left side)
 * - RightPanel (right side)
 */
export function App() {
  const { useState, useEffect, useMemo, useRef } = React;

  function getDefaultSidebarState() {
    return false;
  }

  // State
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [narrativeIndex, setNarrativeIndex] = useState(0);
  const [showNarrativeIntro, setShowNarrativeIntro] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(getDefaultSidebarState);

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
    console.log('Loading project data from data/projects.json');

    fetch('./data/projects.json')
      .then(response => response.json())
      .then(data => {
        console.log('Loaded', data.length, 'projects');
        setProjects(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to load projects:', error);
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

  useEffect(() => {
    if (selectedProject) {
      setIsSidebarOpen(true);
    }
  }, [selectedProject]);

  // Event Handlers
  function handleSelectProject(project) {
    if (!project) {
      console.log('Project deselected');
      setSelectedProject(null);
      return;
    }
    console.log('Project selected:', project.id);
    setSelectedProject(project);
  }

  function handleToggleSidebar() {
    setIsSidebarOpen(prev => !prev);
  }

  function handleCloseSidebar() {
    setIsSidebarOpen(false);
  }

  // Loading state
  if (loading) {
    return React.createElement('main',
      { className: 'app-container' },
      React.createElement('p', null, 'Loading 3D Globe...')
    );
  }

  // Main render - Simple 2-column layout
  return React.createElement('main',
    { className: 'app-container' },

    // Mobile overlay scrim
    React.createElement('div', {
      className: `sidebar-overlay ${isSidebarOpen ? 'visible' : ''}`,
      onClick: handleCloseSidebar,
      role: 'presentation'
    }),

    // Left: Globe
    React.createElement(GlobeContainer, {
      projects,
      selectedProject: selectedProject,
      onProjectClick: handleSelectProject,
      onGlobeReady: () => console.log('Globe ready'),
      narrativeIndex: narrativeIndex,
      onNarrativeChange: setNarrativeIndex,
      onIntroComplete: setShowNarrativeIntro
    }),

    // Right: Project discovery panel
    React.createElement(RightPanel, {
      projects,
      onSelectProject: handleSelectProject,
      onNarrativeChange: setNarrativeIndex,
      onToggleSidebar: handleToggleSidebar,
      isSidebarOpen,
      narrativeIndex,
      selectedProjectId: selectedProject ? selectedProject.id : null,
      showNarrativeIntro
    })
  );
}
