// RightPanel.js - Narrative onboarding + simple scroll

(function() {
  const { useState, useEffect } = React;
  window.MapApp = window.MapApp || {};

  /**
   * RightPanel Component
   */
  window.MapApp.RightPanel = function RightPanel({
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
    const [expandedProject, setExpandedProject] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const isNarrativeIntro = !!showNarrativeIntro;

    // Extract unique tags from all projects
    const allTags = React.useMemo(() => {
      const tagSet = new Set();
      projects.forEach(project => {
        if (project.Theme) {
          project.Theme.split(',').forEach(theme => {
            const tag = theme.trim();
            if (tag) tagSet.add(tag);
          });
        }
        if (project.ProjectCategory) tagSet.add(project.ProjectCategory);
      });
      return Array.from(tagSet).sort();
    }, [projects]);

    // Filter projects based on search and tags
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

        // Tag filter
        if (selectedTags.length > 0) {
          const projectTags = [];
          if (project.Theme) {
            project.Theme.split(',').forEach(t => projectTags.push(t.trim()));
          }
          if (project.ProjectCategory) projectTags.push(project.ProjectCategory);
          const hasSelectedTag = selectedTags.some(tag => projectTags.includes(tag));
          if (!hasSelectedTag) return false;
        }

        return true;
      });
    }, [projects, searchQuery, selectedTags]);

    // Toggle tag selection
    const toggleTag = (tag) => {
      setSelectedTags(prev => 
        prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
      );
    };

    // Clear all filters
    const clearFilters = () => {
      setSearchQuery('');
      setSelectedTags([]);
    };

    // Close detail view
    const closeDetail = () => {
      setExpandedProject(null);
      onSelectProject(null);
    };

    // Handle expanding a project
    const handleExpandProject = (project) => {
      if (!project) return;
      setExpandedProject(project);
      onSelectProject(project);
    };

    // Sync expanded project with selectedProjectId prop
    useEffect(() => {
      if (!selectedProjectId) {
        if (expandedProject) {
          setExpandedProject(null);
        }
        return;
      }
      if (expandedProject && expandedProject.id === selectedProjectId) {
        return;
      }
      const nextProject = projects.find(project => project.id === selectedProjectId);
      if (nextProject) {
        setExpandedProject(nextProject);
      }
    }, [selectedProjectId, expandedProject, projects]);

    // Handle share button click
    const handleShare = (project) => {
      if (window.MapAppUtils && window.MapAppUtils.Share) {
        window.MapAppUtils.Share.shareProject(project);
      } else {
        console.error('Share utilities not loaded');
      }
    };

    const renderCardDetails = (project) => {
      const description = project.DescriptionLong || project.DescriptionShort || project.Description;
      const themeTokens = (project.Theme || '')
        .split(',')
        .map(theme => theme.trim())
        .filter(Boolean);

      const metaItems = [];
      if (project.Location) {
        metaItems.push(React.createElement('div', { className: 'detail-meta-item', key: 'location' },
          React.createElement('strong', null, 'Location:'),
          React.createElement('span', null, project.Location)
        ));
      }
      if (project.Year) {
        metaItems.push(React.createElement('div', { className: 'detail-meta-item', key: 'year' },
          React.createElement('strong', null, 'Year:'),
          React.createElement('span', null, project.Year)
        ));
      }
      if (project.ProjectCategory) {
        metaItems.push(React.createElement('div', { className: 'detail-meta-item', key: 'category' },
          React.createElement('strong', null, 'Category:'),
          React.createElement('span', null, project.ProjectCategory)
        ));
      }

      return React.createElement('div', { className: 'project-detail' },
        React.createElement('button', {
          className: 'detail-close-btn',
          onClick: closeDetail,
          title: 'Close details',
          'aria-label': 'Close project detail view',
          type: 'button'
        }, '✕'),
        React.createElement('button', {
          className: 'detail-back-btn',
          onClick: closeDetail,
          type: 'button',
          'aria-label': 'Return to project list'
        }, 'Back to Projects'),
        React.createElement('div', { className: 'detail-image-wrapper' },
          project.ImageUrl ?
            React.createElement('img', { src: project.ImageUrl, alt: project.ProjectName || 'Project image', className: 'detail-image' }) :
            React.createElement('div', { className: 'detail-image-placeholder', 'aria-hidden': 'true' }, 'No Image')
        ),
        React.createElement('div', { className: 'detail-body' },
          React.createElement('h2', { className: 'detail-title' }, project.ProjectName),
          React.createElement('button', {
            className: 'detail-share-btn',
            onClick: () => handleShare(project),
            type: 'button',
            'aria-label': 'Share this project',
            title: 'Share this project'
          }, '🔗 Share Project'),
          metaItems.length > 0 && React.createElement('div', { className: 'detail-meta' }, metaItems),
          description && React.createElement('div', { className: 'detail-section' },
            React.createElement('h3', null, 'About'),
            React.createElement('p', null, description)
          ),
          project.ProjectLeads && project.ProjectLeads.length > 0 && React.createElement('div', { className: 'detail-section' },
            React.createElement('h3', null, 'Project Leads'),
            React.createElement('ul', null,
              project.ProjectLeads.map((lead, idx) =>
                React.createElement('li', { key: idx }, lead)
              )
            )
          ),
          themeTokens.length > 0 && React.createElement('div', { className: 'detail-section' },
            React.createElement('h3', null, 'Themes'),
            React.createElement('div', { className: 'detail-badges' },
              themeTokens.map((theme, idx) =>
                React.createElement('span', { key: theme + idx, className: 'detail-badge' }, theme)
              )
            )
          ),
          React.createElement('div', { className: 'detail-badges' },
            project.HasArtwork && React.createElement('span', { className: 'detail-badge active' }, 'Art'),
            project.HasMusic && React.createElement('span', { className: 'detail-badge active' }, 'Music'),
            project.HasResearch && React.createElement('span', { className: 'detail-badge active' }, 'Research'),
            project.HasPoems && React.createElement('span', { className: 'detail-badge active' }, 'Poetry')
          )
        )
      );
    };

    const panelClasses = ['right-panel'];
    if (expandedProject) {
      panelClasses.push('detail-open');
    }
    if (isNarrativeIntro && !expandedProject) {
      panelClasses.push('narrative-mode');
    }
    if (isSidebarOpen) {
      panelClasses.push('sidebar-visible');
    } else {
      panelClasses.push('sidebar-hidden');
    }

    const modeLabel = isNarrativeIntro ? 'Narrative Mode' : 'Explorer Mode';

    return React.createElement('div', {
      className: panelClasses.join(' '),
      id: 'right-panel',
      role: 'complementary',
      'aria-label': 'Featured projects panel',
      'aria-hidden': isSidebarOpen ? 'false' : 'true'
    },
      React.createElement('button', {
        type: 'button',
        className: `panel-edge-tab ${isSidebarOpen ? 'open' : 'collapsed'}`,
        onClick: onToggleSidebar,
        'aria-label': isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'
      },
        React.createElement('span', { className: 'panel-edge-icon' }, isSidebarOpen ? '<' : '>'),
        React.createElement('span', { className: 'panel-edge-label' }, isSidebarOpen ? 'Hide' : 'Show')
      ),
      React.createElement('div', { className: 'panel-toolbar' },
        React.createElement('div', { className: 'panel-mode-label' }, modeLabel)
      ),
      React.createElement('div', { className: 'panel-content' },
        isNarrativeIntro
          ? React.createElement(window.MapApp.NarrativeBar, {
            projects: projects,
            onSelectProject: handleExpandProject,
            onNarrativeChange: onNarrativeChange,
            isActive: isNarrativeIntro,
            narrativeIndex: narrativeIndex,
            typewriterProgress: typewriterProgress
          })
          : // EXPLORER MODE - Projects with filters
          React.createElement('div', { className: 'panel-projects-list' },
            // Search and filter controls
            React.createElement('div', { className: 'panel-filters' },
              // Search input
              React.createElement('div', { className: 'filter-search' },
                React.createElement('input', {
                  type: 'text',
                  className: 'search-input',
                  placeholder: 'Search projects...',
                  value: searchQuery,
                  onChange: (e) => setSearchQuery(e.target.value),
                  'aria-label': 'Search projects'
                }),
                searchQuery && React.createElement('button', {
                  className: 'search-clear',
                  onClick: () => setSearchQuery(''),
                  'aria-label': 'Clear search',
                  type: 'button'
                }, '✕')
              ),
              
              // Tag filters
              allTags.length > 0 && React.createElement('div', { className: 'filter-tags' },
                React.createElement('div', { className: 'filter-tags-label' }, 
                  'Filter by theme:',
                  selectedTags.length > 0 && React.createElement('button', {
                    className: 'filter-clear-btn',
                    onClick: clearFilters,
                    type: 'button'
                  }, 'Clear all')
                ),
                React.createElement('div', { className: 'filter-tags-list' },
                  allTags.slice(0, 8).map(tag => 
                    React.createElement('button', {
                      key: tag,
                      className: `filter-tag ${selectedTags.includes(tag) ? 'active' : ''}`,
                      onClick: () => toggleTag(tag),
                      type: 'button',
                      'aria-pressed': selectedTags.includes(tag)
                    }, tag)
                  )
                )
              )
            ),

            // Projects heading with count
            React.createElement('div', { className: 'panel-projects-heading' }, 
              `Projects (${filteredProjects.length})`
            ),

            // Projects list - CLICKABLE
            React.createElement('div', { className: 'panel-projects-scroll' },
              filteredProjects.length === 0 
                ? React.createElement('div', { className: 'panel-projects-empty' },
                    React.createElement('p', null, '😔 No projects match your search'),
                    React.createElement('button', {
                      className: 'filter-clear-btn',
                      onClick: clearFilters,
                      type: 'button'
                    }, 'Clear filters')
                  )
                : filteredProjects.map((project, index) =>
                    React.createElement('button', {
                      key: project.id || index,
                      className: 'panel-project-card',
                      onClick: () => handleExpandProject(project),
                      type: 'button'
                    },
                      React.createElement('div', { className: 'project-card-content' },
                        React.createElement('h3', { className: 'project-card-title' }, 
                          project.ProjectName || `Project ${index + 1}`
                        ),
                        project.Location && React.createElement('p', { className: 'project-card-location' }, 
                          `📍 ${project.Location}`
                        ),
                        project.Theme && React.createElement('div', { className: 'project-card-tags' },
                          project.Theme.split(',').slice(0, 2).map((theme, idx) =>
                            React.createElement('span', { 
                              key: idx, 
                              className: 'project-card-tag' 
                            }, theme.trim())
                          )
                        )
                      )
                    )
                  )
            )
          )
      ),
      expandedProject && React.createElement('div', { className: 'project-detail-modal' },
        renderCardDetails(expandedProject)
      )
    );
  };
})();
