/**
 * themeManager.js - Simple theme detection and application
 * Detects OS preference and provides theme control
 */

const VALID_THEMES = ['light', 'dark', 'zen', 'story'];
const THEME_CLASSES = VALID_THEMES.map(name => `theme-${name}`);

/**
 * Detect user's OS color scheme preference
 * @returns {'light' | 'dark'}
 */
export function detectOSPreference() {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Apply theme to document
 * @param {'light' | 'dark' | 'zen' | 'story'} theme
 */
export function applyTheme(theme) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const normalized = VALID_THEMES.includes(theme) ? theme : 'light';

  // Remove legacy and new theme classes before applying the next one
  THEME_CLASSES.forEach(cls => root.classList.remove(cls));

  root.classList.add(`theme-${normalized}`);
}

/**
 * Get current theme
 * @returns {'light' | 'dark' | 'zen' | 'story'}
 */
export function getCurrentTheme() {
  if (typeof document === 'undefined') return 'light';
  const root = document.documentElement;
  const active = THEME_CLASSES.find(cls => root.classList.contains(cls));
  if (active) {
    return active.replace('theme-', '');
  }
  return 'light';
}

window.MapAppTheme = {
  detectOSPreference,
  applyTheme,
  getCurrentTheme
};
