/**
 * colorUtils.js - Color manipulation utilities for markers
 */

/**
 * Simple string hash function for consistent color picking
 */
export function hashString(str) {
  if (!str) return 0;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Pick a marker color from palette based on project properties
 */
export function pickMarkerColor(project, palette, fallbackColor) {
  const basis = project?.ProjectCategory || project?.Theme || project?.id || 'marker';
  if (!Array.isArray(palette) || palette.length === 0) {
    return fallbackColor;
  }
  const idx = hashString(basis) % palette.length;
  return palette[idx] || fallbackColor;
}

/**
 * Normalize hex color to 6-digit format
 */
export function normalizeHex(hex) {
  if (!hex) return null;
  let clean = hex.trim().replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(ch => ch + ch).join('');
  }
  return clean.length === 6 ? clean : null;
}

/**
 * Lighten a hex color by amount (0-1)
 */
export function lightenHex(hex, amount = 0.2) {
  const clean = normalizeHex(hex);
  if (!clean) return hex;
  const num = parseInt(clean, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  const lighten = (channel) => Math.min(255, Math.round(channel + (255 - channel) * amount));
  const next = (lighten(r) << 16) | (lighten(g) << 8) | lighten(b);
  return `#${next.toString(16).padStart(6, '0')}`;
}
