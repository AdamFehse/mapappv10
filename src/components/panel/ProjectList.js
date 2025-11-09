/**
 * ProjectList.js - Filtered project cards list
 */

export function ProjectList({
  projects = [],
  selectedProjectId = null,
  onSelectProject = () => {},
  onClearFilters = () => {},
  projectTagsMap = new Map()
}) {
  return React.createElement('div', { className: 'panel-projects-list' },
    React.createElement('div', { className: 'panel-projects-scroll' },
      projects.length === 0
        ? React.createElement('div', { className: 'panel-projects-empty' },
            React.createElement('p', null, 'No projects match your search'),
            React.createElement('button', {
              className: 'filter-clear-btn',
              onClick: onClearFilters,
              type: 'button'
            }, 'Clear filters')
          )
        : projects.map((project, index) => {
            const tagKey = project.id !== undefined && project.id !== null ? String(project.id) : project;
            const tagInfo = projectTagsMap.get(tagKey) || { tags: [], themes: [] };
            const previewThemes = tagInfo.themes.slice(0, 2);
            const isSelected = project.id === selectedProjectId;

            return React.createElement('button', {
              key: project.id || index,
              className: `panel-project-card ${isSelected ? 'selected' : ''}`,
              onClick: () => onSelectProject(project),
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
  );
}
