/**
 * Safe JSON parsing utility for localStorage
 * Prevents app crashes from corrupted or invalid JSON data
 */

/**
 * Safely parse JSON from localStorage with fallback
 * @param key - localStorage key to retrieve
 * @param fallback - Default value if parsing fails
 * @returns Parsed value or fallback
 */
export function safeParse<T>(key: string | null, fallback: T): T {
  if (!key) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(key);
    return parsed as T;
  } catch (error) {
    console.warn(`⚠️ Failed to parse JSON from localStorage:`, error);
    return fallback;
  }
}

/**
 * Safely get and parse from localStorage
 * @param key - localStorage key
 * @param fallback - Default value if key doesn't exist or parsing fails
 * @returns Parsed value or fallback
 */
export function safeGetFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return fallback;
    }
    return safeParse(item, fallback);
  } catch (error) {
    console.warn(`⚠️ Error reading from localStorage key "${key}":`, error);
    return fallback;
  }
}

/**
 * Safely set JSON in localStorage
 * @param key - localStorage key
 * @param value - Value to store
 * @returns true if successful, false if failed
 */
export function safeSetInStorage<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`❌ Error writing to localStorage key "${key}":`, error);
    return false;
  }
}
