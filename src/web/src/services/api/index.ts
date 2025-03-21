import axios, { AxiosError, AxiosRequestConfig } from 'axios'; // v1.4.0
import qs from 'qs'; // v6.11.0
import {
  ApiResponse,
  ApiRequestConfig,
  ApiErrorType,
  ApiError,
  ApiRequestOptions,
  ApiClientInterface,
  HttpMethod
} from '../../types/api.types';

// Global constants
const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;

/**
 * Creates and configures the API client with default settings and interceptors
 * @returns Configured API client instance with request methods
 */
const createApiClient = (): ApiClientInterface => {
  // Create axios instance with base URL and default configuration
  const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: DEFAULT_TIMEOUT,
    paramsSerializer: params => qs.stringify(params, { arrayFormat: 'brackets' }),
    withCredentials: true
  });

  // Add request interceptor to include authentication token from local storage
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = getAuthToken();
      if (token && config.headers) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Add response interceptor to standardize successful responses
  axiosInstance.interceptors.response.use(
    (response) => {
      return {
        data: response.data.data || response.data,
        success: true,
        message: response.data.message || null
      };
    },
    (error) => Promise.reject(error)
  );

  // Return object with HTTP methods that wrap axios calls
  return {
    get: <T = any>(
      url: string,
      params?: Record<string, any>,
      headers?: Record<string, any>,
      options?: ApiRequestOptions
    ): Promise<ApiResponse<T>> => get<T>(url, params, headers, options),

    post: <T = any>(
      url: string,
      data?: any,
      headers?: Record<string, any>,
      options?: ApiRequestOptions
    ): Promise<ApiResponse<T>> => post<T>(url, data, headers, options),

    put: <T = any>(
      url: string,
      data?: any,
      headers?: Record<string, any>,
      options?: ApiRequestOptions
    ): Promise<ApiResponse<T>> => put<T>(url, data, headers, options),

    patch: <T = any>(
      url: string,
      data?: any,
      headers?: Record<string, any>,
      options?: ApiRequestOptions
    ): Promise<ApiResponse<T>> => patch<T>(url, data, headers, options),

    delete: <T = any>(
      url: string,
      params?: Record<string, any>,
      headers?: Record<string, any>,
      options?: ApiRequestOptions
    ): Promise<ApiResponse<T>> => deleteRequest<T>(url, params, headers, options)
  };
};

/**
 * Performs a GET request to the specified endpoint
 * @param url - API endpoint URL
 * @param params - Optional query parameters
 * @param headers - Optional custom headers
 * @param options - Optional request options
 * @returns Promise that resolves to the API response with data of type T
 */
export const get = <T = any>(
  url: string,
  params?: Record<string, any>,
  headers?: Record<string, any>,
  options?: ApiRequestOptions
): Promise<ApiResponse<T>> => {
  const config: ApiRequestConfig = {
    url: buildUrl(url),
    method: HttpMethod.GET,
    data: null,
    params: params || null,
    headers: headers || null,
    withCredentials: true,
    responseType: 'json'
  };

  return makeRequest<T>(config, options);
};

/**
 * Performs a POST request to the specified endpoint
 * @param url - API endpoint URL
 * @param data - Optional request body
 * @param headers - Optional custom headers
 * @param options - Optional request options
 * @returns Promise that resolves to the API response with data of type T
 */
export const post = <T = any>(
  url: string,
  data?: any,
  headers?: Record<string, any>,
  options?: ApiRequestOptions
): Promise<ApiResponse<T>> => {
  const config: ApiRequestConfig = {
    url: buildUrl(url),
    method: HttpMethod.POST,
    data: data || null,
    params: null,
    headers: headers || null,
    withCredentials: true,
    responseType: 'json'
  };

  return makeRequest<T>(config, options);
};

/**
 * Performs a PUT request to the specified endpoint
 * @param url - API endpoint URL
 * @param data - Optional request body
 * @param headers - Optional custom headers
 * @param options - Optional request options
 * @returns Promise that resolves to the API response with data of type T
 */
export const put = <T = any>(
  url: string,
  data?: any,
  headers?: Record<string, any>,
  options?: ApiRequestOptions
): Promise<ApiResponse<T>> => {
  const config: ApiRequestConfig = {
    url: buildUrl(url),
    method: HttpMethod.PUT,
    data: data || null,
    params: null,
    headers: headers || null,
    withCredentials: true,
    responseType: 'json'
  };

  return makeRequest<T>(config, options);
};

/**
 * Performs a PATCH request to the specified endpoint
 * @param url - API endpoint URL
 * @param data - Optional request body
 * @param headers - Optional custom headers
 * @param options - Optional request options
 * @returns Promise that resolves to the API response with data of type T
 */
export const patch = <T = any>(
  url: string,
  data?: any,
  headers?: Record<string, any>,
  options?: ApiRequestOptions
): Promise<ApiResponse<T>> => {
  const config: ApiRequestConfig = {
    url: buildUrl(url),
    method: HttpMethod.PATCH,
    data: data || null,
    params: null,
    headers: headers || null,
    withCredentials: true,
    responseType: 'json'
  };

  return makeRequest<T>(config, options);
};

/**
 * Performs a DELETE request to the specified endpoint
 * @param url - API endpoint URL
 * @param params - Optional query parameters
 * @param headers - Optional custom headers
 * @param options - Optional request options
 * @returns Promise that resolves to the API response with data of type T
 */
export const deleteRequest = <T = any>(
  url: string,
  params?: Record<string, any>,
  headers?: Record<string, any>,
  options?: ApiRequestOptions
): Promise<ApiResponse<T>> => {
  const config: ApiRequestConfig = {
    url: buildUrl(url),
    method: HttpMethod.DELETE,
    data: null,
    params: params || null,
    headers: headers || null,
    withCredentials: true,
    responseType: 'json'
  };

  return makeRequest<T>(config, options);
};

/**
 * Core function that makes HTTP requests using axios and handles responses and errors
 * @param config - API request configuration
 * @param options - Optional request options
 * @returns Promise that resolves to the standardized API response
 */
export const makeRequest = async <T = any>(
  config: ApiRequestConfig,
  options?: ApiRequestOptions
): Promise<ApiResponse<T>> => {
  // Apply default options if not provided
  const opts = {
    skipErrorHandling: false,
    skipAuthHeader: false,
    customErrorHandler: undefined,
    ...options
  };

  try {
    // Add authentication header if not skipped and token exists
    if (!opts.skipAuthHeader) {
      const token = getAuthToken();
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`
        };
      }
    }

    // Convert ApiRequestConfig to AxiosRequestConfig
    const axiosConfig: AxiosRequestConfig = {
      url: config.url,
      method: config.method,
      data: config.data,
      params: config.params,
      headers: config.headers,
      withCredentials: config.withCredentials,
      responseType: config.responseType as any
    };

    // Make the HTTP request using axios
    const response = await axios(axiosConfig);

    // Transform successful response to standardized ApiResponse format
    return {
      data: response.data.data !== undefined ? response.data.data : response.data,
      success: true,
      message: response.data.message || null
    };
  } catch (error) {
    // Handle errors using handleApiError unless skipped
    if (!opts.skipErrorHandling) {
      return handleApiError(error, opts.customErrorHandler);
    }

    // Re-throw error if error handling is skipped
    throw error;
  }
};

/**
 * Transforms API errors into a standardized format
 * @param error - The error object from axios or other sources
 * @param customErrorHandler - Optional custom error handler function
 * @throws Standardized ApiError
 */
export const handleApiError = (error: any, customErrorHandler?: (error: any) => never): never => {
  // Check if a custom error handler is provided and use it if so
  if (customErrorHandler) {
    return customErrorHandler(error);
  }

  let errorType = ApiErrorType.UNKNOWN_ERROR;
  let message = 'An unexpected error occurred';
  let errors = null;
  let statusCode = null;
  
  // Check if the error is an Axios error with a response
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    
    // Extract error details from the response if available
    if (axiosError.response) {
      statusCode = axiosError.response.status;
      
      // Extract error message and details if available in the response
      const responseData = axiosError.response.data as any;
      message = responseData?.message || axiosError.message;
      errors = responseData?.errors || null;
      
      // Determine the appropriate ApiErrorType based on status code
      switch (statusCode) {
        case 400:
          errorType = ApiErrorType.VALIDATION_ERROR;
          break;
        case 401:
          errorType = ApiErrorType.AUTHENTICATION_ERROR;
          break;
        case 403:
          errorType = ApiErrorType.AUTHORIZATION_ERROR;
          break;
        case 404:
          errorType = ApiErrorType.RESOURCE_NOT_FOUND;
          break;
        case 409:
          errorType = ApiErrorType.CONFLICT_ERROR;
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          errorType = ApiErrorType.SERVER_ERROR;
          break;
        default:
          errorType = ApiErrorType.UNKNOWN_ERROR;
      }
    } else if (axiosError.request) {
      // The request was made but no response was received
      errorType = ApiErrorType.NETWORK_ERROR;
      message = 'Network error: No response received from server';
    }
  }

  // Create a standardized ApiError object
  const apiError: ApiError = {
    type: errorType,
    message,
    errors,
    statusCode,
    originalError: error
  };

  // Throw the standardized error
  throw apiError;
};

/**
 * Retrieves the authentication token from local storage
 * @returns The authentication token or null if not found
 */
export const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem('accessToken');
  } catch (error) {
    console.error('Error accessing localStorage:', error);
    return null;
  }
};

/**
 * Builds a complete URL by combining the base URL with the endpoint path
 * @param endpoint - The API endpoint path
 * @returns The complete URL
 */
export const buildUrl = (endpoint: string): string => {
  // Check if the endpoint already includes the base URL
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  
  // Ensure the endpoint starts with a slash if needed
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Combine the base URL with the endpoint
  return `${API_BASE_URL}${formattedEndpoint}`;
};

// Create a singleton API client instance
export const apiClient = createApiClient();

// Export individual request functions
export { get, post, put, patch, deleteRequest as delete };