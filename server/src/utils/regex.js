/**
 * Escape a literal string so it can be embedded in a `RegExp` without its meta-characters
 * becoming pattern syntax. Used by the substring search paths (doctor public search, admin
 * patient name search) where we want "cardio" to match "cardiologist" — MongoDB `$text` only
 * does whole-word/stemmed matching, so we fall back to a case-insensitive regex, and any
 * user-supplied `.+*?()[]{}` must be neutralized first to keep it a literal search and avoid
 * ReDoS-style catastrophic backtracking.
 */
export function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
