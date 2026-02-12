/**
 * Currency Utilities
 * Manages currency symbols and defaults across the app
 */

export interface CurrencyData {
  code: string;
  name: string;
  symbol: string;
}

export const CURRENCIES: { [key: string]: CurrencyData } = {
  USD: { code: 'USD', name: 'US Dollar', symbol: '$' },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€' },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£' },
  JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  INR: { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  AUD: { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  CAD: { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  CHF: { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  CNY: { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  AED: { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  SGD: { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  HKD: { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  MXN: { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
  BRL: { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  ZAR: { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
};

/**
 * Get current currency code from localStorage
 * Defaults to INR if not set
 */
export function getCurrentCurrency(): string {
  if (typeof window === 'undefined') return 'INR';
  const stored = localStorage.getItem('defaultCurrency');
  return stored || 'INR';
}

/**
 * Get current currency symbol
 */
export function getCurrentCurrencySymbol(): string {
  const code = getCurrentCurrency();
  return CURRENCIES[code]?.symbol || '₹';
}

/**
 * Get currency data by code
 */
export function getCurrencyData(code: string): CurrencyData {
  return CURRENCIES[code] || CURRENCIES['INR'];
}

/**
 * Get all available currencies as array
 */
export function getAllCurrencies(): CurrencyData[] {
  return Object.values(CURRENCIES);
}

/**
 * Listen for currency changes
 */
export function onCurrencyChange(callback: (currency: string, symbol: string) => void): () => void {
  const handleCurrencyChanged = (event: any) => {
    const currency = event.detail?.currency || 'INR';
    const symbol = CURRENCIES[currency]?.symbol || '₹';
    callback(currency, symbol);
  };

  window.addEventListener('currencyChanged', handleCurrencyChanged);

  // Return unsubscribe function
  return () => {
    window.removeEventListener('currencyChanged', handleCurrencyChanged);
  };
}
