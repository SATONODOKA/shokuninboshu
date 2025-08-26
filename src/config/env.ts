// Environment variables with fallbacks for production
export const ENV = {
  NODE_ENV: import.meta.env.NODE_ENV || 'production',
  BASE_URL: import.meta.env.BASE_URL || '/',
  PROD: import.meta.env.PROD ?? true,
  DEV: import.meta.env.DEV ?? false,
  SSR: import.meta.env.SSR ?? false
} as const;

// Check if we're running in a browser environment
export const isBrowser = typeof window !== 'undefined';

// Check if localStorage is available
export const isLocalStorageAvailable = (() => {
  if (!isBrowser) return false;
  
  try {
    const test = '__localStorage_test__';
    window.localStorage.setItem(test, test);
    window.localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
})();

// Safe date formatting for different environments
export const getTimezoneOffset = () => {
  if (!isBrowser) return 0;
  return new Date().getTimezoneOffset();
};