// NarrativeBar.js - Minimal narrative hero banner
(function() {
  const { useMemo, useCallback } = React;
  window.MapApp = window.MapApp || {};

  const FEATURED_PROJECT_IDS = [
    'project-1-the-place-where-clouds-are-for',
    'project-8-undergraduate-internship-progr',
    'project-19-online-collaboration-and-acade'
  ];

  const resolveHeroImage = (project) => {
    if (!project) return null;
    const primary = project.ImageUrl;
    if (primary && typeof primary === 'string') {
      return primary;
    }
    if (Array.isArray(project.Artworks)) {
      const artworkWithImage = project.Artworks.find(item => item && item.imageUrl);
      if (artworkWithImage) {
        return artworkWithImage.imageUrl;
      }
    }
    return null;
  };

  window.MapApp.NarrativeBar = function NarrativeBar({
    projects = [],
    onSelectProject = () => {},
    isActive = true,
    narrativeIndex = 0
  }) {
    const narrativeProjects = useMemo(() => {
      if (!Array.isArray(projects) || projects.length === 0) {
        return [];
      }
      const featuredMatches = FEATURED_PROJECT_IDS
        .map(featuredId => projects.find(project => project && project.id === featuredId))
        .filter(Boolean);
      if (featuredMatches.length > 0) {
        return featuredMatches;
      }
      return projects.slice(0, Math.min(projects.length, 3));
    }, [projects]);

    const safeIndex = Math.max(0, Math.min(narrativeIndex, Math.max(narrativeProjects.length - 1, 0)));

    const heroProject = narrativeProjects[safeIndex] || narrativeProjects[0] || null;
    const heroImage = resolveHeroImage(heroProject);

    const handleActivate = useCallback(() => {
      if (heroProject && isActive) {
        onSelectProject(heroProject);
      }
    }, [heroProject, onSelectProject, isActive]);

    const handleKeyDown = useCallback((event) => {
      if (!heroProject || !isActive) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onSelectProject(heroProject);
      }
    }, [heroProject, onSelectProject, isActive]);

    if (!heroProject) {
      return React.createElement('section', { className: 'narrative-bar' },
        React.createElement('div', { className: 'narrative-empty' },
          React.createElement('h2', null, 'Borderlands Story Map'),
          React.createElement('p', null, 'Stories will appear here once projects are available.')
        )
      );
    }

    return React.createElement('section', { className: 'narrative-bar' },
      React.createElement('article', {
        className: 'narrative-hero',
        role: 'button',
        tabIndex: 0,
        onClick: handleActivate,
        onKeyDown: handleKeyDown,
        'aria-label': `Open story for ${heroProject.ProjectName || 'project'}`
      },
        heroImage && React.createElement('div', {
          className: 'hero-background',
          style: { backgroundImage: `url(${heroImage})` },
          'aria-hidden': 'true'
        }),
        React.createElement('div', { className: 'hero-overlay', 'aria-hidden': 'true' }),
        React.createElement('div', { className: 'hero-content' },
          React.createElement('div', { className: 'hero-label' }, 'Featured Story'),
          React.createElement('h1', { className: 'hero-title' }, heroProject.ProjectName || 'Untitled Project'),
          heroProject.Location && React.createElement('p', { className: 'hero-meta' }, heroProject.Location),
          isActive && narrativeProjects.length > 1 && React.createElement('div', {
            className: 'hero-progress',
            role: 'group',
            'aria-label': 'Narrative progress'
          },
            narrativeProjects.map((project, idx) =>
              React.createElement('span', {
                key: project.id || idx,
                className: `hero-progress-dot${idx === safeIndex ? ' active' : ''}${idx < safeIndex ? ' completed' : ''}`,
                'aria-hidden': 'true'
              })
            )
          )
        )
      )
    );
  };
})();
