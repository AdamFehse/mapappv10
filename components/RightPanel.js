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
    narrativeIndex = 0,
    typewriterProgress = 0,
    selectedProjectId = null,
    showNarrativeIntro = true
  }) {
    const [expandedProject, setExpandedProject] = useState(null);
    const isNarrativeIntro = !!showNarrativeIntro;

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

    const renderCardDetails = (project) => {
      const description = project.DescriptionLong || project.DescriptionShort || project.Description;
      const themeTokens = (project.Theme || '')
        .split(',')
        .map(theme => theme.trim())
        .filter(Boolean);

      const metaItems = [];
      if (project.Location) {
        metaItems.push(React.createElement('div', { className: 'detail-meta-item', key: 'location' },
          React.createElement('strong', null, '📍 Location:'),
          React.createElement('span', null, project.Location)
        ));
      }
      if (project.Year) {
        metaItems.push(React.createElement('div', { className: 'detail-meta-item', key: 'year' },
          React.createElement('strong', null, '📅 Year:'),
          React.createElement('span', null, project.Year)
        ));
      }
      if (project.ProjectCategory) {
        metaItems.push(React.createElement('div', { className: 'detail-meta-item', key: 'category' },
          React.createElement('strong', null, '📂 Category:'),
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
        }, '← Back to Projects'),
        React.createElement('div', { className: 'detail-image-wrapper' },
          project.ImageUrl ?
            React.createElement('img', { src: project.ImageUrl, alt: project.ProjectName || 'Project image', className: 'detail-image' }) :
            React.createElement('div', { className: 'detail-image-placeholder', 'aria-hidden': 'true' }, '🌍')
        ),
        React.createElement('div', { className: 'detail-body' },
          React.createElement('h2', { className: 'detail-title' }, project.ProjectName),
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
            project.HasArtwork && React.createElement('span', { className: 'detail-badge active' }, '🎨 Art'),
            project.HasMusic && React.createElement('span', { className: 'detail-badge active' }, '🎵 Music'),
            project.HasResearch && React.createElement('span', { className: 'detail-badge active' }, '📚 Research'),
            project.HasPoems && React.createElement('span', { className: 'detail-badge active' }, '✍️ Poetry')
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

    return React.createElement('div', { className: panelClasses.join(' ') },
      isNarrativeIntro
        ? React.createElement(window.MapApp.NarrativeBar, {
          projects: projects,
          onSelectProject: handleExpandProject,
          isActive: isNarrativeIntro,
          narrativeIndex: narrativeIndex,
          typewriterProgress: typewriterProgress
        })
        : // SIMPLE VERTICAL SCROLL - NO EMBLA
        React.createElement('div', { style: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column' } },
          // Title
          React.createElement('div', {
            style: {
              padding: '20px',
              background: '#2196F3',
              color: 'white',
              textAlign: 'center',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              flexShrink: 0
            }
          }, '✨ Projects'),

          // Scrollable container - SIMPLE CSS SCROLL
          React.createElement('div', {
            style: {
              flex: 1,
              width: '100%',
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              padding: '1rem'
            }
          },
            // Render all projects
            projects.map((project, index) =>
              React.createElement('div', {
                key: project.id || index,
                style: {
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '8px',
                  padding: '20px',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  flexShrink: 0,
                  minHeight: '80px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center'
                }
              }, project.ProjectName || `Project ${index + 1}`)
            )
          )
        ),
      expandedProject && React.createElement('div', { className: 'project-detail-modal' },
        renderCardDetails(expandedProject)
      )
    );
  };
})();
