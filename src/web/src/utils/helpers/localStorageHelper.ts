/**
 * LocalStorage Helper Utility
 * 
 * Provides a consistent API for storing, retrieving, and managing client-side
 * data persistence throughout the application with type safety and error handling.
 * Supports storing complex objects through JSON serialization and offers both
 * direct localStorage access and prefixed access for application namespacing.
 */

// Application prefix for all localStorage keys to avoid conflicts with other applications
export const APP_PREFIX = "metronomics_";

/**
 * Checks if localStorage is available in the current browser environment
 * 
 * @returns {boolean} True if localStorage is available, false otherwise
 */
export const isLocalStorageAvailable = (): boolean => {
  try {
    // Try to access window.localStorage
    const storage = window.localStorage;
    // Set a test item
    const testKey = "__storage_test__";
    storage.setItem(testKey, "test");
    // Remove the test item
    storage.removeItem(testKey);
    return true;
  } catch (e) {
    // localStorage not available or disabled
    return false;
  }
};

/**
 * Stores a value in localStorage with JSON serialization for objects
 * 
 * @param {string} key - The key to store the value under
 * @param {any} value - The value to store
 * @returns {boolean} True if the operation succeeded, false otherwise
 */
export const setItem = (key: string, value: any): boolean => {
  if (!isLocalStorageAvailable()) {
    return false;
  }
  
  try {
    // Convert non-string values to JSON
    const valueToStore = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, valueToStore);
    return true;
  } catch (e) {
    // Handle quota exceeded or other errors
    console.error('localStorage setItem error:', e);
    return false;
  }
};

/**
 * Retrieves a value from localStorage with automatic JSON parsing
 * 
 * @param {string} key - The key to retrieve the value for
 * @param {any} defaultValue - The default value to return if the key doesn't exist
 * @returns {any} The retrieved value or defaultValue if not found
 */
export const getItem = (key: string, defaultValue: any = null): any => {
  if (!isLocalStorageAvailable()) {
    return defaultValue;
  }
  
  try {
    const item = localStorage.getItem(key);
    
    if (item === null) {
      return defaultValue;
    }
    
    // Try to parse as JSON, return as-is if not valid JSON
    try {
      return JSON.parse(item);
    } catch {
      return item;
    }
  } catch (e) {
    console.error('localStorage getItem error:', e);
    return defaultValue;
  }
};

/**
 * Removes an item from localStorage
 * 
 * @param {string} key - The key to remove
 * @returns {boolean} True if the operation succeeded, false otherwise
 */
export const removeItem = (key: string): boolean => {
  if (!isLocalStorageAvailable()) {
    return false;
  }
  
  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.error('localStorage removeItem error:', e);
    return false;
  }
};

/**
 * Clears all items from localStorage
 * 
 * @returns {boolean} True if the operation succeeded, false otherwise
 */
export const clear = (): boolean => {
  if (!isLocalStorageAvailable()) {
    return false;
  }
  
  try {
    localStorage.clear();
    return true;
  } catch (e) {
    console.error('localStorage clear error:', e);
    return false;
  }
};

/**
 * Gets all keys currently stored in localStorage
 * 
 * @returns {string[]} Array of keys or empty array if localStorage is not available
 */
export const getKeys = (): string[] => {
  if (!isLocalStorageAvailable()) {
    return [];
  }
  
  try {
    return Object.keys(localStorage);
  } catch (e) {
    console.error('localStorage getKeys error:', e);
    return [];
  }
};

/**
 * Checks if an item exists in localStorage
 * 
 * @param {string} key - The key to check
 * @returns {boolean} True if the item exists, false otherwise
 */
export const hasItem = (key: string): boolean => {
  if (!isLocalStorageAvailable()) {
    return false;
  }
  
  return localStorage.getItem(key) !== null;
};

/**
 * Stores a value in localStorage with a consistent application prefix
 * 
 * @param {string} key - The key to store the value under (will be prefixed)
 * @param {any} value - The value to store
 * @returns {boolean} True if the operation succeeded, false otherwise
 */
export const setItemWithPrefix = (key: string, value: any): boolean => {
  return setItem(`${APP_PREFIX}${key}`, value);
};

/**
 * Retrieves a value from localStorage with a consistent application prefix
 * 
 * @param {string} key - The key to retrieve the value for (will be prefixed)
 * @param {any} defaultValue - The default value to return if the key doesn't exist
 * @returns {any} The retrieved value or defaultValue if not found
 */
export const getItemWithPrefix = (key: string, defaultValue: any = null): any => {
  return getItem(`${APP_PREFIX}${key}`, defaultValue);
};

/**
 * Removes an item from localStorage with a consistent application prefix
 * 
 * @param {string} key - The key to remove (will be prefixed)
 * @returns {boolean} True if the operation succeeded, false otherwise
 */
export const removeItemWithPrefix = (key: string): boolean => {
  return removeItem(`${APP_PREFIX}${key}`);
};

/**
 * Clears all items from localStorage that start with the application prefix
 * 
 * @returns {boolean} True if the operation succeeded, false otherwise
 */
export const clearWithPrefix = (): boolean => {
  if (!isLocalStorageAvailable()) {
    return false;
  }
  
  try {
    const keys = getKeys();
    const prefixedKeys = keys.filter(key => key.startsWith(APP_PREFIX));
    
    prefixedKeys.forEach(key => {
      removeItem(key);
    });
    
    return true;
  } catch (e) {
    console.error('localStorage clearWithPrefix error:', e);
    return false;
  }
};