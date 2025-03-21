/**
 * Utility module for manipulating URL query parameters in the browser.
 * Provides functions for working with query strings for state persistence, 
 * filtering, and navigation throughout the Metronomics Platform.
 */

/**
 * Retrieves all query parameters from the current URL as a key-value object
 * 
 * @returns Object containing all query parameters
 */
export const getQueryParams = (): Record<string, string> => {
  // Get the current URL's search string using window.location.search
  const searchString = window.location.search;
  
  // Use parseQueryString to convert the search string to an object
  return parseQueryString(searchString);
};

/**
 * Retrieves a specific query parameter value from the current URL
 * 
 * @param name - Name of the query parameter to retrieve
 * @returns Value of the specified query parameter or null if not found
 */
export const getQueryParam = (name: string): string | null => {
  // Get all query parameters using getQueryParams
  const params = getQueryParams();
  
  // Return the value for the specified parameter name or null if not present
  return params[name] || null;
};

/**
 * Updates query parameters in the URL without causing a page reload
 * 
 * @param params - Object containing query parameters to update
 * @param replace - Whether to replace the current history entry (true) or add a new one (false)
 */
export const setQueryParams = (
  params: Record<string, string | number | boolean | null | undefined>,
  replace: boolean = false
): void => {
  // Get current query parameters using getQueryParams
  const currentParams = getQueryParams();
  
  // Merge current parameters with new parameters
  const mergedParams = { ...currentParams };
  
  // Update or remove parameters based on the provided values
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      // Remove parameters with null or undefined values
      delete mergedParams[key];
    } else {
      // Update parameter with new value
      mergedParams[key] = String(value);
    }
  });
  
  // Build a new query string using buildQueryString
  const newQueryString = buildQueryString(mergedParams);
  
  // Create the new URL with updated query parameters
  const newUrl = `${window.location.pathname}${newQueryString}${window.location.hash}`;
  
  // Use history.pushState or history.replaceState to update the URL based on the replace parameter
  if (replace) {
    window.history.replaceState({}, '', newUrl);
  } else {
    window.history.pushState({}, '', newUrl);
  }
  
  // Dispatch a custom 'queryparamchange' event to notify listeners of the change
  window.dispatchEvent(new CustomEvent('queryparamchange', {
    detail: { params: mergedParams }
  }));
};

/**
 * Removes a specific query parameter from the URL
 * 
 * @param name - Name of the query parameter to remove
 * @param replace - Whether to replace the current history entry (true) or add a new one (false)
 */
export const removeQueryParam = (name: string, replace: boolean = false): void => {
  // Call setQueryParams with the specified parameter set to null
  // This effectively removes the parameter from the URL
  setQueryParams({ [name]: null }, replace);
};

/**
 * Removes all query parameters from the URL
 * 
 * @param replace - Whether to replace the current history entry (true) or add a new one (false)
 */
export const clearQueryParams = (replace: boolean = false): void => {
  // Create the new URL without any query parameters
  const newUrl = `${window.location.pathname}${window.location.hash}`;
  
  // Use history.pushState or history.replaceState to set the URL without any query parameters
  if (replace) {
    window.history.replaceState({}, '', newUrl);
  } else {
    window.history.pushState({}, '', newUrl);
  }
  
  // Dispatch a custom 'queryparamchange' event to notify listeners of the change
  window.dispatchEvent(new CustomEvent('queryparamchange', {
    detail: { params: {} }
  }));
};

/**
 * Constructs a query string from a parameters object
 * 
 * @param params - Object containing parameter key-value pairs
 * @returns Formatted query string starting with '?' or empty string if no parameters
 */
export const buildQueryString = (
  params: Record<string, string | number | boolean | null | undefined>
): string => {
  // Filter out null and undefined values from the params object
  const validParams = Object.entries(params).filter(
    ([, value]) => value !== null && value !== undefined
  );
  
  // If no valid parameters, return empty string
  if (validParams.length === 0) {
    return '';
  }
  
  // Convert the remaining key-value pairs to URL-encoded string format
  const queryParts = validParams.map(
    ([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
  );
  
  // Join the encoded pairs with '&' and prefix with '?'
  return `?${queryParts.join('&')}`;
};

/**
 * Parses a query string into a key-value object
 * 
 * @param queryString - The query string to parse
 * @returns Object containing parsed query parameters
 */
export const parseQueryString = (queryString: string): Record<string, string> => {
  // Remove the leading '?' if present
  const query = queryString.startsWith('?') ? queryString.substring(1) : queryString;
  
  // If query is empty, return an empty object
  if (!query) {
    return {};
  }
  
  // Split the query string by '&' to get individual key-value pairs
  return query.split('&').reduce((params, param) => {
    // For each pair, split by '=' and decode the key and value
    const [key, value] = param.split('=').map(decodeURIComponent);
    
    // Build and return an object with all decoded key-value pairs
    if (key) {
      params[key] = value || '';
    }
    return params;
  }, {} as Record<string, string>);
};