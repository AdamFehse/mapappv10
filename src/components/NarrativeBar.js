/**
 * NarrativeBar.js - Narrative featured project display with progress
 * ES module version
 */

export function NarrativeBar({
  projects = [],
  onSelectProject = () => {},
  onNarrativeChange = () => {},
  isActive = true,
  narrativeIndex = 0
}) {
  const narrativeConfig = React.useMemo(() => window.MapAppConfig?.narrative || { passages: [] }, []);
  const narrativePassages = narrativeConfig.passages || [];
  const isLowPowerMode = !!(window.MapAppPerf?.isLowPower || window.MapAppPerf?.prefersReducedMotion);
  const sectionClasses = ['narrative-bar'];
  if (isLowPowerMode) {
    sectionClasses.push('low-power');
  }

  const passageProjects = React.useMemo(() => {
    if (!Array.isArray(narrativePassages) || narrativePassages.length === 0) {
      return [];
    }
    return narrativePassages.map((passage) => {
      if (!passage?.featuredProjectId) return null;
      return projects.find((project) => project.id === passage.featuredProjectId) || null;
    });
  }, [projects, narrativePassages]);

  const totalPassages = narrativePassages.length;
  const safeIndex = totalPassages > 0
    ? Math.min(Math.max(narrativeIndex, 0), totalPassages - 1)
    : 0;
  const currentProject = passageProjects[safeIndex] || passageProjects.find(Boolean) || null;
  const progressPercent = 100; // Always full since content displays immediately via CSS animations
  const currentPassage = narrativePassages[safeIndex] || null;

  const heroLabel = currentPassage ? 'Narrative Highlight' : 'Featured Project';
  const heroTitle = currentProject?.ProjectName || currentPassage?.title || 'Featured Story';
  const heroDescription = (currentPassage?.text || currentProject?.DescriptionShort || currentProject?.Description || '').trim();
  const heroMeta = currentProject?.Location ? `Location: ${currentProject.Location}` : '';

  const handleDotNavigate = (index, event) => {
    event.stopPropagation();
    event.preventDefault();
    if (typeof onNarrativeChange === 'function') {
      onNarrativeChange(index);
    }
  };

  const handleSelectProject = () => {
    if (currentProject && isActive) {
      onSelectProject(currentProject);
    }
  };

  if (!currentProject) {
    return React.createElement('section', { className: sectionClasses.join(' ') },
      React.createElement('div', { className: 'narrative-empty' },
        React.createElement('h2', null, 'Welcome'),
        React.createElement('p', null, 'Loading featured projects...')
      )
    );
  }

  return React.createElement('section', { className: sectionClasses.join(' ') },
    React.createElement('button', {
      type: 'button',
      className: 'narrative-hero',
      onClick: handleSelectProject,
      'aria-label': currentProject.ProjectName
        ? `View details for ${currentProject.ProjectName}`
        : 'View featured project details'
    },
      currentProject.ImageUrl && React.createElement('div', {
        className: 'hero-background narrative-fade-bg',
        style: { backgroundImage: `url(${currentProject.ImageUrl})` },
        'aria-hidden': 'true',
        key: `bg-${safeIndex}`
      }),
      React.createElement('div', { className: 'hero-overlay', 'aria-hidden': 'true' }),
      React.createElement('div', { className: 'hero-content narrative-fade-content', key: `content-${safeIndex}` },
        heroLabel && React.createElement('span', { className: 'hero-label' }, heroLabel),
        React.createElement('h1', { className: 'hero-title' }, heroTitle),
        heroMeta && React.createElement('p', { className: 'hero-meta' }, heroMeta),
        heroDescription && React.createElement('p', { className: 'hero-description' }, heroDescription),
        totalPassages > 0 && React.createElement('div', {
          className: 'hero-progress',
          role: 'group',
          'aria-label': 'Narrative sections'
        },
          narrativePassages.map((_, idx) => React.createElement('button', {
            type: 'button',
            key: idx,
            className: ['hero-progress-dot',
              idx === safeIndex ? 'active' : '',
              idx < safeIndex ? 'completed' : ''
            ].filter(Boolean).join(' '),
            onClick: (event) => handleDotNavigate(idx, event),
            'aria-label': `Go to narrative section ${idx + 1} of ${totalPassages}`,
            'aria-pressed': idx === safeIndex
          }))
        ),
        React.createElement('div', { className: 'narrative-progress-track', role: 'presentation' },
          React.createElement('span', {
            className: 'narrative-progress-bar',
            style: { width: `${progressPercent}%` }
          })
        )
      )
    )
  );
}
