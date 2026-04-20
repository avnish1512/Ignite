/**
 * Text formatting utilities for consistent display.
 */

/**
 * Capitalizes the first letter of each word in a string.
 * Handles edge cases: null, undefined, empty string, extra spaces.
 *
 * @example
 *   capitalizeWords("prajwal kumar")  → "Prajwal Kumar"
 *   capitalizeWords("JOHN DOE")       → "John Doe"
 *   capitalizeWords("")               → ""
 *   capitalizeWords(null)             → ""
 */
export function capitalizeWords(name: string | null | undefined): string {
  if (!name || typeof name !== 'string') return '';
  return name
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Returns initials from a name (max 2 characters).
 *
 * @example
 *   getInitials("Prajwal Kumar") → "PK"
 *   getInitials("John")          → "J"
 */
export function getInitials(name: string | null | undefined): string {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  return parts[0].charAt(0).toUpperCase();
}
