/**
 * stringUtils.js - String manipulation utilities for markers and text
 */

/**
 * Get marker badge text (abbreviation, label, or initials)
 */
export function getMarkerBadgeText(project) {
  const explicit = (project?.MarkerLabel || project?.Abbreviation || '').trim();
  if (explicit) {
    return explicit.slice(0, 3).toUpperCase();
  }
  const name = (project?.ProjectName || '').trim();
  if (!name) return 'NA';
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 3).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Get marker label text with optional truncation
 */
export function getMarkerLabelText(project, maxChars) {
  const name = (project?.ProjectName || '').trim();
  if (!name || typeof maxChars !== 'number' || maxChars <= 0) return name;
  return name.length <= maxChars ? name : `${name.slice(0, Math.max(0, maxChars - 3))}...`;
}

/**
 * Truncate string to max length with ellipsis
 */
export function truncateString(str, maxLength) {
  if (!str || typeof maxLength !== 'number' || maxLength <= 0) return str;
  return str.length <= maxLength ? str : `${str.slice(0, Math.max(0, maxLength - 3))}...`;
}
