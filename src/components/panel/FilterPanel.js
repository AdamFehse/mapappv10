/**
 * FilterPanel.js - Filter controls for project search
 */

export function FilterPanel({
  searchQuery = '',
  onSearchChange = () => {},
  selectedTags = [],
  onToggleTag = () => {},
  allTags = [],
  selectedCategories = [],
  onToggleCategory = () => {},
  allCategories = [],
  selectedYears = [],
  onToggleYear = () => {},
  allYears = [],
  selectedProducts = [],
  onToggleProduct = () => {},
  allProducts = [],
  onClearAllFilters = () => {},
  filteredCount = 0
}) {
  const [expandedFilters, setExpandedFilters] = React.useState({
    themes: false,
    categories: false,
    years: false,
    products: false
  });

  const toggleFilterSection = (section) => {
    setExpandedFilters(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const hasActiveFilters = selectedTags.length > 0 || selectedCategories.length > 0 ||
                           selectedYears.length > 0 || selectedProducts.length > 0;

  return React.createElement('div', { className: 'panel-filters' },
    // Search input with project count
    React.createElement('div', { className: 'filter-search-section' },
      React.createElement('div', { className: 'filter-search' },
        React.createElement('input', {
          type: 'text',
          className: 'search-input',
          placeholder: 'Search projects...',
          value: searchQuery,
          onChange: (e) => onSearchChange(e.target.value),
          'aria-label': 'Search projects'
        }),
        searchQuery && React.createElement('button', {
          className: 'search-clear',
          onClick: () => onSearchChange(''),
          'aria-label': 'Clear search',
          type: 'button'
        }, '✕')
      ),
      React.createElement('div', { className: 'filter-count-badge' },
        `${filteredCount} Projects`
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
              onClick: () => onToggleTag(tag),
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
              onClick: () => onToggleCategory(cat),
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
              onClick: () => onToggleYear(year),
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
              onClick: () => onToggleProduct(prod),
              type: 'button',
              'aria-pressed': selectedProducts.includes(prod)
            }, prod)
          )
        )
      )
    ),

    // Clear all button if any filters are active
    hasActiveFilters && React.createElement('button', {
      className: 'filter-clear-all-btn',
      onClick: onClearAllFilters,
      type: 'button'
    }, '✕ Clear all filters')
  );
}
