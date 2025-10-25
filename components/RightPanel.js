// RightPanel.js - Right side panel with narrative showcase and project explorer

(function() {
  const { useState, useEffect } = React;
  window.MapApp = window.MapApp || {};

  /**
   * RightPanel Component
   *
   * RESPONSIBILITY:
   * - Orchestrates NarrativeBar and ExploreBar components
   * - Manages detail view overlay for expanded projects
   * - Handles narrative phase switching
   */
  window.MapApp.RightPanel = function RightPanel({
    projects = [],
    onSelectProject = () => {},
    narrativeIndex = 0,
    selectedProjectId = null
  }) {
    const [expandedProject, setExpandedProject] = useState(null);

    const isNarrativeIntro = narrativeIndex < 2;

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
    } else {
      panelClasses.push('explore-mode');
    }

    return React.createElement('div', { className: panelClasses.join(' ') },
      isNarrativeIntro ?
        React.createElement(window.MapApp.NarrativeBar, {
          projects: projects,
          onSelectProject: handleExpandProject,
          isActive: isNarrativeIntro,
          narrativeIndex: narrativeIndex
        }) :
        React.createElement(window.MapApp.ExploreBar, {
          projects: projects,
          onSelectProject: handleExpandProject,
          selectedProjectId: selectedProjectId,
          onExpandProject: handleExpandProject
        }),
      expandedProject && React.createElement('div', { className: 'project-detail-modal' },
        renderCardDetails(expandedProject)
      )
    );
  };
})();
