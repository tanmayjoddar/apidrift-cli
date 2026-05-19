/**
 * Sanitizes a snapshot tag into a safe filename.
 *
 * Only allows A-Z, a-z, 0-9, '.', '_', and '-'.
 * All other characters are replaced with '_'.
 *
 * This prevents:
 * - Path traversal attacks via '../' or '..\'
 * - Invalid filename characters on Windows (e.g. ':', '*', '?', '"', '<', '>', '|')
 * - Accidental subdirectory creation via '/' or '\'
 *
 * @param {string} tag - The raw snapshot tag from user input.
 * @returns {string} A sanitized tag safe for use as a filename.
 */
export function sanitizeTag(tag) {
  if (typeof tag !== "string" || tag.length === 0) {
    return "untitled";
  }

  // Replace any character that is NOT alphanumeric, dot, underscore, or hyphen
  let sanitized = tag.replace(/[^A-Za-z0-9._-]/g, "_");

  // Collapse consecutive underscores (e.g. "foo___bar" -> "foo_bar")
  sanitized = sanitized.replace(/_+/g, "_");

  // Strip leading/trailing underscores and dots for safety
  sanitized = sanitized.replace(/^[_\.]+|[_\.]+$/g, "");

  // Replace any remaining '..' sequences (path traversal) with '_'
  sanitized = sanitized.replace(/\.\./g, "_");

  // Collapse any new consecutive underscores from the '..' replacement
  sanitized = sanitized.replace(/_+/g, "_");

  // Strip again after '..' replacement
  sanitized = sanitized.replace(/^[_\.]+|[_\.]+$/g, "");

  // Final safety: if sanitization produced an empty string, return a default
  if (sanitized.length === 0) {
    return "untitled";
  }

  return sanitized;
}
