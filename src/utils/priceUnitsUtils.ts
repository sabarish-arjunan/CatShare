/**
 * Price Units Utilities
 * Manages price units across the app
 */

/**
 * Get price units from localStorage
 * Returns the default units if not set
 */
export function getPriceUnits(): string[] {
  if (typeof window === 'undefined') {
    return ['/ piece', '/ dozen', '/ set', '/ kg'];
  }
  
  try {
    const stored = localStorage.getItem('priceFieldUnits');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    // Silently fail
  }
  
  // Return defaults
  return ['/ piece', '/ dozen', '/ set', '/ kg'];
}

/**
 * Listen for price units changes
 */
export function onPriceUnitsChange(callback: (units: string[]) => void): () => void {
  const handleUnitsChanged = (event: any) => {
    const units = event.detail?.units || ['/ piece', '/ dozen', '/ set', '/ kg'];
    callback(units);
  };

  window.addEventListener('priceUnitsChanged', handleUnitsChanged);

  // Return unsubscribe function
  return () => {
    window.removeEventListener('priceUnitsChanged', handleUnitsChanged);
  };
}
