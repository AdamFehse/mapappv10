/**
 * ProjectDetailView.js - Detailed view of a selected project
 */

export function ProjectDetailView({
  project = null,
  projectTagsMap = new Map(),
  onClose = () => {},
  onShare = () => {}
}) {
  if (!project) {
    return null;
  }

  const description = project.DescriptionLong || project.DescriptionShort || project.Description;
  const tagKey = project.id !== undefined && project.id !== null ? String(project.id) : project;
  const tagInfo = projectTagsMap.get(tagKey) || { tags: [], themes: [] };
  const themeTokens = tagInfo.themes;

  // Build metadata items
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
      onClick: onClose,
      type: 'button',
      'aria-label': 'Return to project list'
    }, '← Back to Projects'),

    React.createElement('div', { className: 'detail-image-wrapper' },
      project.ImageUrl
        ? React.createElement('img', {
            src: project.ImageUrl,
            alt: project.ProjectName || 'Project image',
            className: 'detail-image'
          })
        : React.createElement('div', {
            className: 'detail-image-placeholder',
            'aria-hidden': 'true'
          }, 'No Image')
    ),

    React.createElement('div', { className: 'detail-body' },
      React.createElement('h2', { className: 'detail-title' }, project.ProjectName),

      React.createElement('button', {
        className: 'detail-share-btn',
        onClick: () => onShare(project),
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

      // Content type badges
      React.createElement('div', { className: 'detail-section' },
        React.createElement('h3', null, 'Content Types'),
        React.createElement('div', { className: 'detail-badges' },
          project.HasArtwork && React.createElement('span', { className: 'detail-badge active' }, 'Art'),
          project.HasMusic && React.createElement('span', { className: 'detail-badge active' }, 'Music'),
          project.HasResearch && React.createElement('span', { className: 'detail-badge active' }, 'Research'),
          project.HasPoems && React.createElement('span', { className: 'detail-badge active' }, 'Poetry')
        )
      )
    )
  );
}
