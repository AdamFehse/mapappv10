/**
 * filterUtils.js - Filter state and data extraction utilities
 */

/**
 * Factory to create toggle function for array state
 */
export function makeToggler(setState) {
  return (value) => {
    setState(prev => prev.includes(value)
      ? prev.filter(v => v !== value)
      : [...prev, value]
    );
  };
}

/**
 * Extract unique values from projects for a field
 */
export function extractUniqueValues(projects, fieldName, sort = true, sortFn) {
  const values = new Set();

  projects.forEach(project => {
    if (!project) return;
    const val = project[fieldName];
    if (!val) return;

    if (Array.isArray(val)) {
      val.forEach(v => {
        const trimmed = String(v).trim();
        if (trimmed) values.add(trimmed);
      });
    } else {
      const trimmed = String(val).trim();
      if (trimmed) values.add(trimmed);
    }
  });

  const result = Array.from(values);
  if (sort) {
    return sortFn ? result.sort(sortFn) : result.sort();
  }
  return result;
}

/**
 * Extract themes from projects (comma-separated)
 */
export function extractThemes(projects) {
  const themes = new Set();
  projects.forEach(project => {
    if (!project || !project.Theme) return;
    if (typeof project.Theme === 'string') {
      project.Theme.split(',').forEach(theme => {
        const trimmed = theme.trim();
        if (trimmed) themes.add(trimmed);
      });
    }
  });
  return Array.from(themes).sort();
}

/**
 * Extract categories from projects
 */
export function extractCategories(projects) {
  return extractUniqueValues(projects, 'ProjectCategory');
}

/**
 * Extract years from projects, sorted newest first
 */
export function extractYears(projects) {
  return extractUniqueValues(projects, 'Year', true, (a, b) => b - a);
}

/**
 * Extract products from projects
 */
export function extractProducts(projects) {
  return extractUniqueValues(projects, 'Product');
}

/**
 * Precompute tags for each project (themes + categories)
 */
export function buildProjectTagsMap(projects) {
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
        if (trimmed) themeTokens.push(trimmed);
      });
    }

    const uniqueThemes = Array.from(new Set(themeTokens));
    const tags = uniqueThemes.slice();

    const categoryRaw = project.ProjectCategory;
    if (categoryRaw) {
      const category = String(categoryRaw).trim();
      if (category) tags.push(category);
    }

    const uniqueTags = Array.from(new Set(tags));
    map.set(key, { tags: uniqueTags, themes: uniqueThemes });
  });

  return map;
}

/**
 * Check if project matches all active filters
 */
export function matchesAllFilters(project, {
  searchQuery = '',
  selectedTags = [],
  selectedCategories = [],
  selectedYears = [],
  selectedProducts = [],
  projectTagsMap = new Map()
}) {
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
}
