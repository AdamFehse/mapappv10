/**
 * RightPanel.js - Right sidebar orchestrating filter panel, project list, and detail view
 * Modern ES module version
 */

import { FilterPanel } from './panel/FilterPanel.js';
import { ProjectList } from './panel/ProjectList.js';
import { ProjectDetailView } from './panel/ProjectDetailView.js';
import { buildProjectTagsMap, extractThemes, extractCategories, extractYears, extractProducts } from '../utils/filterUtils.js';

export function RightPanel({
  projects = [],
  onSelectProject = () => {},
  onNarrativeChange = () => {},
  onToggleSidebar = () => {},
  isSidebarOpen = true,
  narrativeIndex = 0,
  typewriterProgress = 0,
  selectedProjectId = null,
  showNarrativeIntro = true
}) {
  // State
  const [expandedProject, setExpandedProject] = React.useState(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedTags, setSelectedTags] = React.useState([]);
  const [selectedCategories, setSelectedCategories] = React.useState([]);
  const [selectedYears, setSelectedYears] = React.useState([]);
  const [selectedProducts, setSelectedProducts] = React.useState([]);

  const isNarrativeIntro = !!showNarrativeIntro;

  // Use utility to build tags map
  const projectTagsMap = React.useMemo(() => buildProjectTagsMap(projects), [projects]);

  // Extract filter options
  const allTags = React.useMemo(() => extractThemes(projects), [projects]);
  const allCategories = React.useMemo(() => extractCategories(projects), [projects]);
  const allYears = React.useMemo(() => extractYears(projects), [projects]);
  const allProducts = React.useMemo(() => extractProducts(projects), [projects]);

  // Filter projects
  const filteredProjects = React.useMemo(() => {
    return projects.filter(project => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = (project.ProjectName || '').toLowerCase().includes(query);
        const matchesDesc = (project.Description || '').toLowerCase().includes(query);
        const matchesLocation = (project.Location || '').toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesLocation) return false;
      }

      // Theme filter
      if (selectedTags.length > 0) {
        const key = project.id !== undefined && project.id !== null ? String(project.id) : project;
        const tagInfo = projectTagsMap.get(key);
        const projectTags = tagInfo ? tagInfo.tags : [];
        const hasSelectedTag = selectedTags.some(tag => projectTags.includes(tag));
        if (!hasSelectedTag) return false;
      }

      // Category filter
      if (selectedCategories.length > 0) {
        const projectCat = String(project.ProjectCategory || '').trim();
        if (!selectedCategories.includes(projectCat)) return false;
      }

      // Year filter
      if (selectedYears.length > 0) {
        if (!selectedYears.includes(project.Year)) return false;
      }

      // Product filter
      if (selectedProducts.length > 0) {
        const projectProd = String(project.Product || '').trim();
        if (!selectedProducts.includes(projectProd)) return false;
      }

      return true;
    });
  }, [projects, projectTagsMap, searchQuery, selectedTags, selectedCategories, selectedYears, selectedProducts]);

  // Toggle functions
  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const toggleCategory = (cat) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const toggleYear = (year) => {
    setSelectedYears(prev =>
      prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
    );
  };

  const toggleProduct = (prod) => {
    setSelectedProducts(prev =>
      prev.includes(prod) ? prev.filter(p => p !== prod) : [...prev, prod]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setSelectedCategories([]);
    setSelectedYears([]);
    setSelectedProducts([]);
  };

  // Close detail view
  const closeDetail = () => {
    setExpandedProject(null);
    onSelectProject(null);
  };

  // Expand project
  const handleExpandProject = (project) => {
    if (!project) return;
    setExpandedProject(project);
    onSelectProject(project);
  };

  // Sync expanded project with selected project ID from parent
  React.useEffect(() => {
    if (!selectedProjectId) {
      if (expandedProject) setExpandedProject(null);
      return;
    }
    if (expandedProject && expandedProject.id === selectedProjectId) return;

    const nextProject = projects.find(project => project.id === selectedProjectId);
    if (nextProject) setExpandedProject(nextProject);
  }, [selectedProjectId, expandedProject, projects]);

  // Share handler
  const handleShare = (project) => {
    if (window.MapAppUtils && window.MapAppUtils.Share) {
      window.MapAppUtils.Share.shareProject(project);
    }
  };

  // Panel classes
  const panelClasses = ['right-panel'];
  if (expandedProject) panelClasses.push('detail-open');
  if (isNarrativeIntro && !expandedProject) panelClasses.push('narrative-mode');
  if (isSidebarOpen) {
    panelClasses.push('sidebar-visible');
  } else {
    panelClasses.push('sidebar-hidden');
  }

  const modeLabel = isNarrativeIntro ? 'Narrative journey' : 'Project explorer';
  const panelContentId = 'right-panel-content';
  const toggleLabel = isSidebarOpen ? 'Collapse project explorer' : 'Expand project explorer';

  // Toggle button
  const toggleButton = React.createElement('button', {
    type: 'button',
    className: `panel-toggle-tab ${isSidebarOpen ? 'open' : 'collapsed'}`,
    onClick: onToggleSidebar,
    'aria-label': toggleLabel,
    'aria-expanded': isSidebarOpen,
    'aria-controls': panelContentId,
    title: toggleLabel
  },
    React.createElement('span', { className: 'panel-toggle-icon', 'aria-hidden': 'true' }, isSidebarOpen ? '>' : '<'),
    React.createElement('span', { className: 'panel-toggle-text' }, isSidebarOpen ? 'Hide Projects' : 'Show Projects')
  );

  // Main panel element
  const panelElement = React.createElement('aside', {
    className: panelClasses.join(' '),
    id: 'right-panel',
    role: 'complementary',
    'aria-label': 'Featured projects panel',
    'aria-hidden': isSidebarOpen ? undefined : 'true'
  },
    // Toolbar
    React.createElement('div', {
      className: 'panel-toolbar',
      hidden: !isSidebarOpen,
      'aria-hidden': isSidebarOpen ? undefined : 'true'
    },
      React.createElement('div', { className: 'panel-mode-label' }, modeLabel),
      React.createElement('button', {
        type: 'button',
        className: 'panel-close-btn',
        onClick: () => {
          if (isSidebarOpen) onToggleSidebar();
        },
        'aria-label': 'Close project explorer'
      }, 'Close')
    ),

    // Content
    React.createElement('div', {
      className: 'panel-content',
      id: panelContentId,
      hidden: !isSidebarOpen,
      'aria-hidden': isSidebarOpen ? undefined : 'true'
    },
      isNarrativeIntro
        ? // Narrative mode - show featured project
        React.createElement(window.MapApp.NarrativeBar, {
          projects: projects,
          onSelectProject: handleExpandProject,
          onNarrativeChange: onNarrativeChange,
          isActive: isNarrativeIntro,
          narrativeIndex: narrativeIndex,
          typewriterProgress: typewriterProgress
        })
        : // Explorer mode - show filters and list
        React.createElement('div', { className: 'panel-projects-list' },
          // Filter panel
          React.createElement(FilterPanel, {
            searchQuery: searchQuery,
            onSearchChange: setSearchQuery,
            selectedTags: selectedTags,
            onToggleTag: toggleTag,
            allTags: allTags,
            selectedCategories: selectedCategories,
            onToggleCategory: toggleCategory,
            allCategories: allCategories,
            selectedYears: selectedYears,
            onToggleYear: toggleYear,
            allYears: allYears,
            selectedProducts: selectedProducts,
            onToggleProduct: toggleProduct,
            allProducts: allProducts,
            onClearAllFilters: clearFilters,
            filteredCount: filteredProjects.length
          }),

          // Project list
          React.createElement(ProjectList, {
            projects: filteredProjects,
            selectedProjectId: selectedProjectId,
            onSelectProject: handleExpandProject,
            onClearFilters: clearFilters,
            projectTagsMap: projectTagsMap
          })
        )
    ),

    // Detail view modal
    isSidebarOpen && expandedProject && React.createElement('div', { className: 'project-detail-modal' },
      React.createElement(ProjectDetailView, {
        project: expandedProject,
        projectTagsMap: projectTagsMap,
        onClose: closeDetail,
        onShare: handleShare
      })
    )
  );

  return React.createElement(React.Fragment, null, toggleButton, panelElement);
}
