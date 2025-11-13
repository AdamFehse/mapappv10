/**
 * MarkerManager.js - Minimal placeholder marker system
 * Simple circles with theme integration - ready for future iteration
 */

import { getMarkerBadgeText, getMarkerLabelText } from '../../utils/stringUtils.js';
import { resolveThemeColor } from '../../utils/themeVars.js';

const markerVisualCache = new Map();

/**
 * Convert SVG string to data URI
 */
function svgToDataUri(svgString) {
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    return 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svgString)));
  }
  return 'data:image/svg+xml;base64,' + btoa(svgString);
}

/**
 * Create minimal placeholder marker - simple circle with badge text
 * Theme-wired but basic - ready for future iteration
 */
function createMarkerSvg({ text, fontSize, size, isSelected }) {
  const markerSize = size || 40;
  const center = markerSize / 2;

  // Get theme color
  const markerColor = resolveThemeColor('--marker-default-color', '#6aa8ff');
  const textColor = resolveThemeColor('--marker-badge-text', '#ffffff');

  return `
    <svg width="${markerSize}" height="${markerSize}" viewBox="0 0 ${markerSize} ${markerSize}" xmlns="http://www.w3.org/2000/svg">
      <circle
        cx="${center}"
        cy="${center}"
        r="${center - 2}"
        fill="${markerColor}"
        stroke="rgba(0,0,0,0.2)"
        stroke-width="1"
      />
      <text
        x="${center}"
        y="${center + fontSize * 0.35}"
        text-anchor="middle"
        font-family="Inter, sans-serif"
        font-size="${fontSize}"
        font-weight="600"
        fill="${textColor}"
      >${text}</text>
    </svg>
  `.trim();
}

/**
 * Create cache key for marker visual
 */
function createMarkerVisualCacheKey(project, markerOptions, isSelected, theme) {
  const paletteKey = Array.isArray(markerOptions?.palette)
    ? markerOptions.palette.join(',')
    : 'none';

  return [
    project?.id ?? '',
    project?.ProjectName ?? '',
    project?.MarkerLabel ?? '',
    project?.Abbreviation ?? '',
    project?.ProjectCategory ?? '',
    project?.Theme ?? '',
    markerOptions?.size || '',
    markerOptions?.labelMaxChars || '',
    paletteKey,
    theme || 'light',
    isSelected ? 'selected' : 'default',
    typeof project?.clusterSize === 'number' && project.clusterSize > 1 ? `cluster-${project.clusterSize}` : 'single'
  ].join('|');
}

/**
 * Build marker visual (image, dimensions, label)
 * Theme-integrated with CSS variables
 */
function buildMarkerVisual(project, markerOptions, isSelected, theme = 'light') {
  if (!project) return null;

  const isClustered = typeof project.clusterSize === 'number' && project.clusterSize > 1;
  const cacheKey = createMarkerVisualCacheKey(project, markerOptions, isSelected, theme);

  // Return cached visual if available
  if (markerVisualCache.has(cacheKey)) {
    return markerVisualCache.get(cacheKey);
  }

  // Determine badge text
  const badgeText = isClustered
    ? `+${project.clusterSize}`
    : getMarkerBadgeText(project);

  const fontSize = badgeText.length <= 2 ? 14 : badgeText.length <= 3 ? 12 : 10;
  const markerSize = markerOptions.size || 40;

  // Generate simple SVG
  const svgMarkup = createMarkerSvg({
    text: badgeText,
    fontSize,
    size: markerSize,
    isSelected
  });

  // Build visual object
  const visual = {
    image: svgToDataUri(svgMarkup),
    width: markerSize,
    height: markerSize,
    scale: isSelected ? 1.2 : 1.0,
    labelText: getMarkerLabelText(project, markerOptions.labelMaxChars)
  };

  // Cache it
  markerVisualCache.set(cacheKey, visual);
  return visual;
}

/**
 * Update marker graphics on Cesium entity
 */
function updateMarkerGraphics(entity, markerOptions, isSelected, theme = 'light') {
  if (!entity || !entity.projectData || !entity.billboard) return;

  const visual = buildMarkerVisual(entity.projectData, markerOptions, isSelected, theme);
  if (!visual) return;

  entity.billboard.image = visual.image;
  entity.billboard.width = visual.width;
  entity.billboard.height = visual.height;
  entity.billboard.scale = visual.scale;
  entity.billboard.verticalOrigin = Cesium.VerticalOrigin.BOTTOM;
  entity.billboard.pixelOffset = new Cesium.Cartesian2(0, -8);
  entity.billboard.disableDepthTestDistance = Number.POSITIVE_INFINITY;

  if (entity.label) {
    entity.label.text = visual.labelText;
    entity.label.show = !!markerOptions.showLabels;
    entity.label.pixelOffset = new Cesium.Cartesian2(0, 14);
    entity.label.font = '600 12px "Inter", sans-serif';
  }
}

export const MarkerManager = {
  buildMarkerVisual,
  updateMarkerGraphics,
  clearCache: () => markerVisualCache.clear()
};
