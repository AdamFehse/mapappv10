/**
 * MarkerTooltip.js - Theme-aware tooltip for map markers
 * Displays project name and category on marker hover
 */

export function MarkerTooltip({ project, position, visible }) {
  const { useEffect, useRef } = React;
  const tooltipRef = useRef(null);

  if (!project || !position || !visible) {
    return null;
  }

  // Smart positioning: flip tooltip if near edges
  useEffect(() => {
    if (!tooltipRef.current) return;

    const tooltip = tooltipRef.current;
    const rect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Reset transforms
    tooltip.style.transform = '';

    // Horizontal flip if near right edge
    if (position.x + rect.width > viewportWidth - 20) {
      tooltip.classList.add('flip-horizontal');
    } else {
      tooltip.classList.remove('flip-horizontal');
    }

    // Vertical flip if near bottom edge
    if (position.y + rect.height > viewportHeight - 20) {
      tooltip.classList.add('flip-vertical');
    } else {
      tooltip.classList.remove('flip-vertical');
    }
  }, [position, visible]);

  const projectName = project?.ProjectName || 'Untitled Project';
  const category = project?.ProjectCategory || project?.Theme || null;

  return React.createElement(
    'div',
    {
      ref: tooltipRef,
      className: `marker-tooltip ${visible ? 'visible' : ''}`,
      style: {
        left: `${position.x}px`,
        top: `${position.y}px`
      }
    },
    [
      // Project name
      React.createElement(
        'div',
        { key: 'name', className: 'marker-tooltip-name' },
        projectName
      ),
      // Category badge (if exists)
      category &&
        React.createElement(
          'div',
          { key: 'category', className: 'marker-tooltip-category' },
          category
        )
    ]
  );
}
