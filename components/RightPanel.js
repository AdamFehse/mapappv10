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
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedYears, setSelectedYears] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [expandedFilters, setExpandedFilters] = useState({
      themes: false,
      categories: false,
      years: false,
      products: false
    });
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

    // Extract unique tags and other filter categories
    const allTags = React.useMemo(() => {
      const tagSet = new Set();
      projectTagsMap.forEach(info => {
        info.tags.forEach(tag => tagSet.add(tag));
      });
      return Array.from(tagSet).sort();
    }, [projectTagsMap]);

    // Extract project categories
    const allCategories = React.useMemo(() => {
      const catSet = new Set();
      projects.forEach(project => {
        if (project.ProjectCategory) {
          catSet.add(String(project.ProjectCategory).trim());
        }
      });
      return Array.from(catSet).sort();
    }, [projects]);

    // Extract years
    const allYears = React.useMemo(() => {
      const yearSet = new Set();
      projects.forEach(project => {
        if (project.Year) {
          yearSet.add(project.Year);
        }
      });
      return Array.from(yearSet).sort((a, b) => b - a); // Newest first
    }, [projects]);

    // Extract products/types
    const allProducts = React.useMemo(() => {
      const prodSet = new Set();
      projects.forEach(project => {
        if (project.Product) {
          prodSet.add(String(project.Product).trim());
        }
      });
      return Array.from(prodSet).sort();
    }, [projects]);

    // Filter projects based on search and all filter categories
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

    // Toggle selections for each filter type
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

    // Helper to toggle individual filter section
    const toggleFilterSection = (section) => {
      setExpandedFilters(prev => ({
        ...prev,
        [section]: !prev[section]
      }));
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
          className: 'detail-back-btn',
          onClick: closeDetail,
          type: 'button',
          'aria-label': 'Return to project list'
        }, '← Back to Projects'),
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
              // Search input with project count
              React.createElement('div', { className: 'filter-search-section' },
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
                React.createElement('div', { className: 'filter-count-badge' },
                  `${filteredProjects.length} Projects`
                )
              ),

              // Collapsible filter categories in a row
              React.createElement('div', { className: 'filter-categories-row' },
                // Themes filter
                allTags.length > 0 && React.createElement('div', { className: 'filter-category' },
                  React.createElement('button', {
                    className: `filter-category-toggle ${expandedFilters.themes ? 'expanded' : ''}`,
                    onClick: () => toggleFilterSection('themes'),
                    type: 'button',
                    'aria-expanded': expandedFilters.themes,
                    'aria-controls': 'filter-themes-section'
                  },
                    `▼ Themes ${selectedTags.length > 0 ? `(${selectedTags.length})` : ''}`
                  ),
                  expandedFilters.themes && React.createElement('div', { className: 'filter-items', id: 'filter-themes-section' },
                    allTags.map(tag =>
                      React.createElement('button', {
                        key: tag,
                        className: `filter-item ${selectedTags.includes(tag) ? 'active' : ''}`,
                        onClick: () => toggleTag(tag),
                        type: 'button',
                        'aria-pressed': selectedTags.includes(tag)
                      }, tag)
                    )
                  )
                ),

                // Category filter
                allCategories.length > 0 && React.createElement('div', { className: 'filter-category' },
                  React.createElement('button', {
                    className: `filter-category-toggle ${expandedFilters.categories ? 'expanded' : ''}`,
                    onClick: () => toggleFilterSection('categories'),
                    type: 'button',
                    'aria-expanded': expandedFilters.categories,
                    'aria-controls': 'filter-categories-section'
                  },
                    `▼ Type ${selectedCategories.length > 0 ? `(${selectedCategories.length})` : ''}`
                  ),
                  expandedFilters.categories && React.createElement('div', { className: 'filter-items', id: 'filter-categories-section' },
                    allCategories.map(cat =>
                      React.createElement('button', {
                        key: cat,
                        className: `filter-item ${selectedCategories.includes(cat) ? 'active' : ''}`,
                        onClick: () => toggleCategory(cat),
                        type: 'button',
                        'aria-pressed': selectedCategories.includes(cat)
                      }, cat)
                    )
                  )
                ),

                // Year filter
                allYears.length > 0 && React.createElement('div', { className: 'filter-category' },
                  React.createElement('button', {
                    className: `filter-category-toggle ${expandedFilters.years ? 'expanded' : ''}`,
                    onClick: () => toggleFilterSection('years'),
                    type: 'button',
                    'aria-expanded': expandedFilters.years,
                    'aria-controls': 'filter-years-section'
                  },
                    `▼ Year ${selectedYears.length > 0 ? `(${selectedYears.length})` : ''}`
                  ),
                  expandedFilters.years && React.createElement('div', { className: 'filter-items', id: 'filter-years-section' },
                    allYears.map(year =>
                      React.createElement('button', {
                        key: year,
                        className: `filter-item ${selectedYears.includes(year) ? 'active' : ''}`,
                        onClick: () => toggleYear(year),
                        type: 'button',
                        'aria-pressed': selectedYears.includes(year)
                      }, year)
                    )
                  )
                ),

                // Product filter
                allProducts.length > 0 && React.createElement('div', { className: 'filter-category' },
                  React.createElement('button', {
                    className: `filter-category-toggle ${expandedFilters.products ? 'expanded' : ''}`,
                    onClick: () => toggleFilterSection('products'),
                    type: 'button',
                    'aria-expanded': expandedFilters.products,
                    'aria-controls': 'filter-products-section'
                  },
                    `▼ Medium ${selectedProducts.length > 0 ? `(${selectedProducts.length})` : ''}`
                  ),
                  expandedFilters.products && React.createElement('div', { className: 'filter-items', id: 'filter-products-section' },
                    allProducts.map(prod =>
                      React.createElement('button', {
                        key: prod,
                        className: `filter-item ${selectedProducts.includes(prod) ? 'active' : ''}`,
                        onClick: () => toggleProduct(prod),
                        type: 'button',
                        'aria-pressed': selectedProducts.includes(prod)
                      }, prod)
                    )
                  )
                ),

              ),

              // Clear all button if any filters are active (outside the row)
              (selectedTags.length > 0 || selectedCategories.length > 0 || selectedYears.length > 0 || selectedProducts.length > 0) &&
              React.createElement('button', {
                className: 'filter-clear-all-btn',
                onClick: clearFilters,
                type: 'button'
              }, '✕ Clear all filters')
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
