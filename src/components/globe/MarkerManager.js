/**
 * MarkerManager.js - Marker creation and visual management
 */

import { pickMarkerColor, lightenHex } from '../../utils/colorUtils.js';
import { getMarkerBadgeText, getMarkerLabelText } from '../../utils/stringUtils.js';

const markerVisualCache = new Map();

function svgToDataUri(svgString) {
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    return 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svgString)));
  }
  return 'data:image/svg+xml;base64,' + btoa(svgString);
}

function createMarkerSvg({ text, baseColor, accentColor, strokeColor, fontSize, isSelected }) {
  const glow = isSelected ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.35)';
  return `
    <svg width="64" height="80" viewBox="0 0 64 80" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="markerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${accentColor}"/>
          <stop offset="100%" stop-color="${baseColor}"/>
        </linearGradient>
        <filter id="markerShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="${glow}" flood-opacity="0.8"/>
        </filter>
      </defs>
      <path d="M32 2C19 2 9 12.6 9 26.3c0 19.8 23 45.9 23 45.9s23-25.6 23-45.9C55 12.6 45 2 32 2z"
        fill="url(#markerGrad)" stroke="${strokeColor}" stroke-width="2" filter="url(#markerShadow)" />
      <circle cx="32" cy="27" r="15" fill="rgba(255,255,255,0.12)"/>
      <text x="32" y="32" text-anchor="middle" font-family="Inter, Arial, sans-serif"
        font-size="${fontSize}" font-weight="700" fill="#ffffff" letter-spacing="0.5">${text}</text>
    </svg>
  `.trim();
}

function createMarkerVisualCacheKey(project, markerOptions, baseColor, isSelected) {
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
    baseColor || '',
    markerOptions?.defaultColor || '',
    markerOptions?.selectedColor || '',
    markerOptions?.size || '',
    markerOptions?.labelMaxChars || '',
    paletteKey,
    isSelected ? 'selected' : 'default'
  ].join('|');
}

function buildMarkerVisual(project, markerOptions, isSelected) {
  if (!project) return null;

  const paletteColor = pickMarkerColor(project, markerOptions.palette, markerOptions.defaultColor);
  const baseColor = isSelected ? (markerOptions.selectedColor || paletteColor) : paletteColor;
  const cacheKey = createMarkerVisualCacheKey(project, markerOptions, baseColor, isSelected);

  if (markerVisualCache.has(cacheKey)) {
    return markerVisualCache.get(cacheKey);
  }

  const accentColor = lightenHex(baseColor, 0.25);
  const strokeColor = isSelected ? lightenHex(baseColor, 0.35) : 'rgba(13, 27, 42, 0.45)';
  const badgeText = getMarkerBadgeText(project);
  const fontSize = badgeText.length === 1 ? 22 : badgeText.length === 2 ? 18 : 14;

  const svgMarkup = createMarkerSvg({
    text: badgeText,
    baseColor,
    accentColor,
    strokeColor,
    fontSize,
    isSelected
  });

  const visual = {
    image: svgToDataUri(svgMarkup),
    width: markerOptions.size,
    height: Math.round(markerOptions.size * 1.25),
    scale: isSelected ? 1.08 : 1,
    labelText: getMarkerLabelText(project, markerOptions.labelMaxChars)
  };

  markerVisualCache.set(cacheKey, visual);
  return visual;
}

function updateMarkerGraphics(entity, markerOptions, isSelected) {
  if (!entity || !entity.projectData || !entity.billboard) return;

  const visual = buildMarkerVisual(entity.projectData, markerOptions, isSelected);
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
