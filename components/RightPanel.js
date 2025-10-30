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

    // Precompute tags for each project
    const projectTagsMap = React.useMemo(() => {
      const map = new Map();
      projects.forEach(project => {
        if (!project) return;
        const key = project.id !== undefined && project.id !== null
          ? String(project.id)
          : project;

        const themeTokens = [];
        if (typeof project.Theme === 'string') {
          project.Theme.split(',').forEach(theme => {
            const trimmed = theme.trim();
            if (trimmed) {
              themeTokens.push(trimmed);
            }
          });
        }
        const uniqueThemes = Array.from(new Set(themeTokens));
        const tags = uniqueThemes.slice();
        const categoryRaw = project.ProjectCategory;
        if (categoryRaw) {
          const category = String(categoryRaw).trim();
          if (category) {
            tags.push(category);
          }
        }
        const uniqueTags = Array.from(new Set(tags));
        map.set(key, { tags: uniqueTags, themes: uniqueThemes });
      });
      return map;
    }, [projects]);

    // Extract unique tags from all projects
    const allTags = React.useMemo(() => {
      const tagSet = new Set();
      projectTagsMap.forEach(info => {
        info.tags.forEach(tag => tagSet.add(tag));
      });
      return Array.from(tagSet).sort();
    }, [projectTagsMap]);

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
          const key = project.id !== undefined && project.id !== null ? String(project.id) : project;
          const tagInfo = projectTagsMap.get(key);
          const projectTags = tagInfo ? tagInfo.tags : [];
          const hasSelectedTag = selectedTags.some(tag => projectTags.includes(tag));
          if (!hasSelectedTag) return false;
        }

        return true;
      });
    }, [projects, projectTagsMap, searchQuery, selectedTags]);

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
      const tagKey = project.id !== undefined && project.id !== null ? String(project.id) : project;
      const tagInfo = projectTagsMap.get(tagKey) || { tags: [], themes: [] };
      const themeTokens = tagInfo.themes;

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
        }, 'Close'),
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
          }, 'Copy share link'),
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

    const modeLabel = isNarrativeIntro ? 'Narrative journey' : 'Project explorer';
    const panelContentId = 'right-panel-content';
    const toggleLabel = isSidebarOpen ? 'Collapse project explorer' : 'Expand project explorer';

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

    const panelElement = React.createElement('aside', {
      className: panelClasses.join(' '),
      id: 'right-panel',
      role: 'complementary',
      'aria-label': 'Featured projects panel',
      'aria-hidden': isSidebarOpen ? undefined : 'true'
    },
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
            if (isSidebarOpen) {
              onToggleSidebar();
            }
          },
          'aria-label': 'Close project explorer'
        }, 'Close')
      ),
      React.createElement('div', {
        className: 'panel-content',
        id: panelContentId,
        hidden: !isSidebarOpen,
        'aria-hidden': isSidebarOpen ? undefined : 'true'
      },
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
                }, 'Clear')
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
              `${filteredProjects.length} projects`
            ),

            // Projects list - CLICKABLE
            React.createElement('div', { className: 'panel-projects-scroll' },
              filteredProjects.length === 0 
                ? React.createElement('div', { className: 'panel-projects-empty' },
                    React.createElement('p', null, 'No projects match your search'),
                    React.createElement('button', {
                      className: 'filter-clear-btn',
                      onClick: clearFilters,
                      type: 'button'
                    }, 'Clear filters')
                  )
                : filteredProjects.map((project, index) => {
                    const tagKey = project.id !== undefined && project.id !== null ? String(project.id) : project;
                    const tagInfo = projectTagsMap.get(tagKey) || { tags: [], themes: [] };
                    const previewThemes = tagInfo.themes.slice(0, 2);
                    return React.createElement('button', {
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
                          `Location: ${project.Location}`
                        ),
                        previewThemes.length > 0 && React.createElement('div', { className: 'project-card-tags' },
                          previewThemes.map((theme, idx) =>
                            React.createElement('span', { 
                              key: idx, 
                              className: 'project-card-tag' 
                            }, theme)
                          )
                        )
                      )
                    );
                  })
              )
          )
      ),
      isSidebarOpen && expandedProject && React.createElement('div', { className: 'project-detail-modal' },
        renderCardDetails(expandedProject)
      )
    );

    return React.createElement(React.Fragment, null, toggleButton, panelElement);
  };
})();
