export const COLOR_THEMES = [
  {
    id: 'light',
    label: 'Light',
    cssClass: 'theme-light',
    mapStyle: 'light',
    colorScheme: 'light',
    metaColor: '#ffffff',
    lensColors: {
      rectangleBase: '#d4845c',
      rectangleOutline: '#e8a876',
      vignetteColor: '#1a1410'
    }
  },
  {
    id: 'dark',
    label: 'Dark',
    cssClass: 'theme-dark',
    mapStyle: 'dark',
    colorScheme: 'dark',
    metaColor: '#050914',
    lensColors: {
      rectangleBase: '#f6a55d',
      rectangleOutline: '#ffe8cf',
      vignetteColor: '#050505'
    }
  },
  {
    id: 'zen',
    label: 'Zen',
    cssClass: 'theme-zen',
    mapStyle: 'zen',
    colorScheme: 'dark',
    metaColor: '#041f1c',
    lensColors: {
      rectangleBase: '#4da6a0',
      rectangleOutline: '#7fbbb5',
      vignetteColor: '#051715'
    }
  }
];

export const CINEMATIC_THEME = {
  id: 'story',
  label: 'Story',
  cssClass: 'theme-story',
  mapStyle: 'dark',
  colorScheme: 'dark',
  metaColor: '#170b1c',
  selectable: false,
  lensColors: {
    rectangleBase: '#e85d6a',
    rectangleOutline: '#f5a8b0',
    vignetteColor: '#1a0b15'
  }
};

export const ALL_THEMES = [...COLOR_THEMES, CINEMATIC_THEME];

export const THEME_CLASS_PREFIX = 'theme-';

export const SELECTABLE_THEME_IDS = COLOR_THEMES.map(theme => theme.id);

export const ALL_THEME_IDS = ALL_THEMES.map(theme => theme.id);

export function getThemeDefinition(themeId) {
  return ALL_THEMES.find(theme => theme.id === themeId);
}

export function getMapStyleForTheme(themeId) {
  const definition = getThemeDefinition(themeId);
  return definition?.mapStyle || 'light';
}

export function getMetaColorForTheme(themeId) {
  const definition = getThemeDefinition(themeId);
  return definition?.metaColor;
}

export function getSelectableThemes() {
  return COLOR_THEMES.map(({ id, label }) => ({ id, label }));
}

export function getLensColorsForTheme(themeId) {
  const definition = getThemeDefinition(themeId);
  return definition?.lensColors || COLOR_THEMES[0].lensColors;
}
