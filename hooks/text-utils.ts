/**
 * Text utility functions for the Ignite Portal.
 */

/**
 * Sanitizes strings from the database, handling common placeholders
 * like "none", "N/A", or empty values.
 */
export function sanitizeText(text: string | null | undefined, fallback: string = ''): string {
  if (!text) return fallback;
  const lower = text.toLowerCase().trim();
  if (lower === 'none' || lower === 'n/a' || lower === 'null' || lower === 'undefined') {
    return fallback;
  }
  return text;
}

/**
 * Returns a dynamic greeting based on the current time of day.
 */
export function getDynamicGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Capitalizes the first letter of each word in a string.
 */
export function capitalizeWords(str: string): string {
  if (!str) return '';
  return str.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
}
/**
 * Returns initials from a full name (e.g., "John Doe" -> "JD").
 */
export function getInitials(name: string): string {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
