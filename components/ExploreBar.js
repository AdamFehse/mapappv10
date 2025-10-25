// ExploreBar.js - Project cards carousel with search/filter
(function() {
  const { useState, useMemo, useRef, useEffect } = React;
  window.MapApp = window.MapApp || {};

  const FEATURED_PROJECT_IDS = [
    'project-1-the-place-where-clouds-are-for',
    'project-37-creating-emancipatory-spaces-t',
    'project-19-online-collaboration-and-acade',
    'project-42-cross-border-recovery-and-peda',
    'project-8-undergraduate-internship-progr'
  ];

  window.MapApp.ExploreBar = function ExploreBar({
    projects = [],
    onSelectProject = () => {},
    selectedProjectId = null,
    onExpandProject = () => {}
  }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedTheme, setSelectedTheme] = useState(null);
    const cardsEmblaRef = useRef(null);

    // Get unique categories
    const categories = useMemo(() => {
      const unique = new Set();
      projects.forEach(project => {
        if (project.ProjectCategory) {
          unique.add(String(project.ProjectCategory).trim());
        }
      });
      return Array.from(unique).sort((a, b) => a.localeCompare(b));
    }, [projects]);

    // Get unique themes
    const themes = useMemo(() => {
      const unique = new Set();
      projects.forEach(project => {
        if (project.Theme) {
          project.Theme.split(',').forEach(theme => {
            const value = theme.trim();
            if (value) unique.add(value);
          });
        }
      });
      return Array.from(unique).sort((a, b) => a.localeCompare(b));
    }, [projects]);

    // Filter projects
    const filteredProjects = useMemo(() => {
      const query = searchQuery.trim().toLowerCase();
      return projects.filter(project => {
        const projectName = (project.ProjectName || '').toLowerCase();
        const leads = Array.isArray(project.ProjectLeads) ? project.ProjectLeads : [];
        const location = (project.Location || '').toLowerCase();

        const matchesSearch = !query ||
          projectName.includes(query) ||
          leads.some(lead => (lead || '').toLowerCase().includes(query)) ||
          location.includes(query);

        const matchesCategory = !selectedCategory ||
          (project.ProjectCategory && project.ProjectCategory.trim() === selectedCategory);

        const themeTokens = (project.Theme || '')
          .split(',')
          .map(theme => theme.trim())
          .filter(Boolean);

        const matchesTheme = !selectedTheme || themeTokens.includes(selectedTheme);

        return matchesSearch && matchesCategory && matchesTheme;
      });
    }, [projects, searchQuery, selectedCategory, selectedTheme]);

    // Initialize Embla carousel with touchpad/mouse wheel support
    useEffect(() => {
      if (!cardsEmblaRef.current) return;
      if (!window.EmblaCarousel) {
        console.warn('EmblaCarousel library not available.');
        return;
      }

      let embla;
      let wheelPlugin = null;
      let cleanupWheelHandler = null;
      try {
        const plugins = [];
        const wheelGlobal = window.EmblaCarouselWheelGestures;
        let wheelPluginFactory = null;
        if (typeof wheelGlobal === 'function') {
          wheelPluginFactory = wheelGlobal;
        } else if (wheelGlobal && typeof wheelGlobal.WheelGesturesPlugin === 'function') {
          wheelPluginFactory = wheelGlobal.WheelGesturesPlugin;
        } else if (wheelGlobal && typeof wheelGlobal.default === 'function') {
          wheelPluginFactory = wheelGlobal.default;
        }

        if (wheelPluginFactory) {
          wheelPlugin = wheelPluginFactory({
            forceWheelAxis: 'y',
            target: cardsEmblaRef.current
          });
          if (wheelPlugin) {
            plugins.push(wheelPlugin);
          }
        }

        embla = window.EmblaCarousel(
          cardsEmblaRef.current,
          {
            axis: 'y',
            align: 'start',
            containScroll: 'trimSnaps',
            dragFree: true
          },
          plugins
        );

        if (!wheelPlugin) {
          const node = cardsEmblaRef.current;
          const handleWheel = (event) => {
            if (!embla) return;
            if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
              return;
            }
            event.preventDefault();
            embla.scrollBy(event.deltaY);
          };
          node.addEventListener('wheel', handleWheel, { passive: false });
          cleanupWheelHandler = () => {
            node.removeEventListener('wheel', handleWheel);
          };
        }

        return () => {
          if (cleanupWheelHandler) {
            cleanupWheelHandler();
          }
          embla.destroy();
        };
      } catch (error) {
        console.error('Failed to initialize cards carousel:', error);
        if (cleanupWheelHandler) {
          cleanupWheelHandler();
        }
        if (embla) {
          embla.destroy();
        }
      }
    }, [filteredProjects.length]);

    const handleClearFilters = () => {
      setSearchQuery('');
      setSelectedCategory(null);
      setSelectedTheme(null);
    };

    const hasActiveFilters = Boolean(selectedCategory || selectedTheme);
    const hasSearchQuery = searchQuery.trim().length > 0;
    const showClearFilters = hasActiveFilters || hasSearchQuery;

    const renderCard = (project) => {
      const isFeatured = FEATURED_PROJECT_IDS.includes(project.id);
      const isSelected = selectedProjectId === project.id;
      const cardClassNames = ['glowy-card', 'embla__slide'];
      if (isFeatured) cardClassNames.push('is-featured');
      if (isSelected) cardClassNames.push('is-selected');

      const themeTokens = (project.Theme || '')
        .split(',')
        .map(theme => theme.trim())
        .filter(Boolean);

      return React.createElement('article', {
        key: project.id,
        className: cardClassNames.join(' '),
        onClick: () => onSelectProject(project),
        onKeyDown: (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSelectProject(project);
          }
        },
        role: 'listitem',
        tabIndex: 0,
        'aria-label': project.ProjectName || 'Project',
        'aria-current': isSelected ? 'true' : undefined
      },
        React.createElement('div', { className: 'card-image-wrapper' },
          project.ImageUrl ?
            React.createElement('img', { src: project.ImageUrl, alt: project.ProjectName || 'Project image', className: 'card-image' }) :
            React.createElement('div', { className: 'image-placeholder', 'aria-hidden': 'true' }, '🌍')
        ),
        React.createElement('div', { className: 'card-body' },
          React.createElement('h4', { className: 'card-title' }, project.ProjectName),
          React.createElement('div', { className: 'card-meta' },
            React.createElement('span', { className: 'meta-item' }, `📍 ${project.Location || 'Unknown location'}`),
            project.Year && React.createElement('span', { className: 'meta-item' }, `📅 ${project.Year}`)
          ),
          project.ProjectCategory && React.createElement('p', { className: 'card-category' }, project.ProjectCategory),
          themeTokens.length > 0 && React.createElement('div', { className: 'card-themes' },
            themeTokens.map((theme, idx) =>
              React.createElement('span', { key: theme + idx, className: 'badge theme' }, theme)
            )
          ),
          React.createElement('div', { className: 'card-content-badges' },
            project.HasArtwork && React.createElement('span', { className: 'badge' }, '🎨 Art'),
            project.HasMusic && React.createElement('span', { className: 'badge' }, '🎵 Music'),
            project.HasResearch && React.createElement('span', { className: 'badge' }, '📚 Research'),
            project.HasPoems && React.createElement('span', { className: 'badge' }, '✍️ Poetry')
          ),
          React.createElement('button', {
            className: 'card-view-btn',
            type: 'button',
            onClick: (event) => {
              event.stopPropagation();
              onExpandProject(project);
            },
            'aria-label': `View details for ${project.ProjectName}`
          }, 'View Details →')
        )
      );
    };

    return React.createElement('div', { className: 'explore-bar' },
      React.createElement('div', { className: 'panel-top' },
        React.createElement('div', { className: 'panel-title-group' },
          React.createElement('h3', { className: 'panel-title' }, 'Explore Projects'),
          React.createElement('span', { className: 'panel-subtitle' }, `${filteredProjects.length} project${filteredProjects.length !== 1 ? 's' : ''}`)
        ),
        React.createElement('div', { className: 'panel-controls' },
          React.createElement('div', { className: 'panel-control search-control' },
            React.createElement('label', { className: 'sr-only', htmlFor: 'project-search' }, 'Search projects'),
            React.createElement('input', {
              id: 'project-search',
              type: 'search',
              className: 'search-input',
              placeholder: 'Search projects...',
              value: searchQuery,
              onChange: (event) => setSearchQuery(event.target.value),
              autoComplete: 'off',
              'aria-label': 'Search projects'
            })
          ),
          React.createElement('div', { className: 'panel-control' },
            React.createElement('label', { className: 'sr-only', htmlFor: 'category-filter' }, 'Filter by category'),
            React.createElement('select', {
              id: 'category-filter',
              className: 'filter-select',
              value: selectedCategory || '',
              onChange: (event) => {
                const value = event.target.value.trim();
                setSelectedCategory(value || null);
              },
              'aria-label': 'Filter by category'
            },
              React.createElement('option', { value: '' }, 'All Categories'),
              categories.map(category =>
                React.createElement('option', { key: category, value: category }, category)
              )
            )
          ),
          React.createElement('div', { className: 'panel-control' },
            React.createElement('label', { className: 'sr-only', htmlFor: 'theme-filter' }, 'Filter by theme'),
            React.createElement('select', {
              id: 'theme-filter',
              className: 'filter-select',
              value: selectedTheme || '',
              onChange: (event) => {
                const value = event.target.value.trim();
                setSelectedTheme(value || null);
              },
              'aria-label': 'Filter by theme'
            },
              React.createElement('option', { value: '' }, 'All Themes'),
              themes.map(theme =>
                React.createElement('option', { key: theme, value: theme }, theme)
              )
            )
          ),
          showClearFilters && React.createElement('button', {
            type: 'button',
            className: 'panel-clear-btn',
            onClick: handleClearFilters
          }, 'Clear')
        )
      ),
      filteredProjects.length > 0 ?
        React.createElement('div', { ref: cardsEmblaRef, className: 'cards-container embla', role: 'list' },
          React.createElement('div', { className: 'embla__container' },
            filteredProjects.map(renderCard)
          )
        ) :
        React.createElement('div', { className: 'no-results' },
          React.createElement('p', null, 'No projects found. Try adjusting your filters.')
        )
    );
  };
})();
