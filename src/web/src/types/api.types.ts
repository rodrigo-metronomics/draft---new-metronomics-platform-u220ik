import { AxiosError } from 'axios'; // v1.4.0
import { ID, PaginationParams, ErrorObject } from './common.types';
import { 
  AuthUser, 
  LoginRequest, 
  RegisterRequest, 
  RefreshTokenRequest, 
  PasswordResetRequest, 
  ChangePasswordRequest 
} from './auth.types';

/**
 * Generic interface for API responses with data, success status, and optional message
 */
export interface ApiResponse<T = any> {
  /** Response data of generic type T */
  data: T;
  /** Indicates if the API call was successful */
  success: boolean;
  /** Optional message providing additional context about the response */
  message: string | null;
}

/**
 * Interface for standardized API error responses
 */
export interface ErrorResponse {
  /** Indicates that the API call was unsuccessful */
  success: boolean;
  /** Error message describing what went wrong */
  message: string;
  /** Array of structured error objects, if available */
  errors: ErrorObject[] | null;
  /** HTTP status code associated with the error */
  statusCode: number | null;
}

/**
 * Enum for HTTP methods used in API requests
 */
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE'
}

/**
 * Interface for API request configuration options
 */
export interface ApiRequestConfig {
  /** API endpoint URL */
  url: string;
  /** HTTP method to use */
  method: HttpMethod;
  /** Request body data (for POST, PUT, PATCH) */
  data: any | null;
  /** URL query parameters */
  params: Record<string, any> | null;
  /** Custom HTTP headers */
  headers: Record<string, string> | null;
  /** Whether to include credentials in cross-origin requests */
  withCredentials: boolean;
  /** Expected response type (json, text, blob, etc.) */
  responseType: string;
}

/**
 * Generic interface for paginated API responses
 */
export interface PaginatedApiResponse<T = any> {
  /** Paginated response data */
  data: {
    /** Array of items for the current page */
    items: T[];
    /** Total number of items across all pages */
    total: number;
    /** Current page number */
    page: number;
    /** Number of items per page */
    pageSize: number;
    /** Total number of pages */
    totalPages: number;
  };
  /** Indicates if the API call was successful */
  success: boolean;
  /** Optional message providing additional context about the response */
  message: string | null;
}

/**
 * Enum for categorizing different types of API errors
 */
export enum ApiErrorType {
  /** Error in request validation (400 Bad Request) */
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  /** Authentication related error (401 Unauthorized) */
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  /** Authorization related error (403 Forbidden) */
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  /** Requested resource not found (404 Not Found) */
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  /** Resource conflict error (409 Conflict) */
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  /** Server-side error (500 Internal Server Error) */
  SERVER_ERROR = 'SERVER_ERROR',
  /** Network connectivity issue */
  NETWORK_ERROR = 'NETWORK_ERROR',
  /** Unspecified or unknown error */
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Interface for structured API error objects with detailed information
 */
export interface ApiError {
  /** Type of API error for categorization */
  type: ApiErrorType;
  /** Human-readable error message */
  message: string;
  /** Detailed error objects for validation errors */
  errors: ErrorObject[] | null;
  /** HTTP status code associated with the error */
  statusCode: number | null;
  /** Original error object for debugging */
  originalError: AxiosError | Error | null;
}

/**
 * Interface for authentication API responses containing tokens and user data
 */
export interface AuthResponse {
  /** JWT access token for authenticating API requests */
  accessToken: string;
  /** Refresh token for obtaining a new access token when it expires */
  refreshToken: string;
  /** Token expiration time in seconds */
  expiresIn: number;
  /** Authenticated user information */
  user: AuthUser;
}

/**
 * Interface for additional API request options to customize behavior
 */
export interface ApiRequestOptions {
  /** Skip the default error handling if set to true */
  skipErrorHandling?: boolean;
  /** Skip adding authorization header if set to true */
  skipAuthHeader?: boolean;
  /** Custom error handler function */
  customErrorHandler?: (error: any) => never;
}

/**
 * Interface defining the API client methods for making HTTP requests
 */
export interface ApiClientInterface {
  /**
   * Send a GET request to the specified URL
   * @param url - The API endpoint URL
   * @param params - Query parameters
   * @param headers - Custom headers
   * @param options - Additional request options
   * @returns Promise resolving to API response
   */
  get<T = any>(
    url: string,
    params?: Record<string, any>,
    headers?: Record<string, any>,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>>;

  /**
   * Send a POST request to the specified URL
   * @param url - The API endpoint URL
   * @param data - Request body
   * @param headers - Custom headers
   * @param options - Additional request options
   * @returns Promise resolving to API response
   */
  post<T = any>(
    url: string,
    data?: any,
    headers?: Record<string, any>,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>>;

  /**
   * Send a PUT request to the specified URL
   * @param url - The API endpoint URL
   * @param data - Request body
   * @param headers - Custom headers
   * @param options - Additional request options
   * @returns Promise resolving to API response
   */
  put<T = any>(
    url: string,
    data?: any,
    headers?: Record<string, any>,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>>;

  /**
   * Send a PATCH request to the specified URL
   * @param url - The API endpoint URL
   * @param data - Request body
   * @param headers - Custom headers
   * @param options - Additional request options
   * @returns Promise resolving to API response
   */
  patch<T = any>(
    url: string,
    data?: any,
    headers?: Record<string, any>,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>>;

  /**
   * Send a DELETE request to the specified URL
   * @param url - The API endpoint URL
   * @param params - Query parameters
   * @param headers - Custom headers
   * @param options - Additional request options
   * @returns Promise resolving to API response
   */
  delete<T = any>(
    url: string,
    params?: Record<string, any>,
    headers?: Record<string, any>,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>>;
}

/**
 * Interface for query parameters used in API list requests
 */
export interface QueryParams extends PaginationParams {
  /** Optional search term for filtering results */
  search?: string;
  /** Optional filters object for advanced filtering */
  filters?: Record<string, any>;
  /** Optional start date for date range filtering */
  startDate?: string;
  /** Optional end date for date range filtering */
  endDate?: string;
}

/**
 * Interface for identifying resources by ID in API requests
 */
export interface ResourceIdentifier {
  /** Resource unique identifier */
  id: ID;
}

/**
 * Interface for results of batch operations on multiple resources
 */
export interface BatchOperationResult {
  /** Indicates if the overall operation was successful */
  success: boolean;
  /** Total number of items processed */
  totalProcessed: number;
  /** Number of successfully processed items */
  successCount: number;
  /** Number of items that failed processing */
  failureCount: number;
  /** Details about failed operations */
  failures: Array<{ id: ID, error: string }> | null;
}

/**
 * Interface for file upload API responses
 */
export interface FileUploadResponse {
  /** URL where the uploaded file can be accessed */
  fileUrl: string;
  /** Original filename of the uploaded file */
  fileName: string;
  /** Size of the uploaded file in bytes */
  fileSize: number;
  /** MIME type of the uploaded file */
  mimeType: string;
}

/**
 * Interface for data export request options
 */
export interface ExportRequestOptions {
  /** Desired export file format */
  format: 'csv' | 'xlsx' | 'pdf';
  /** Optional filters to apply to the exported data */
  filters?: Record<string, any>;
  /** Optional array of columns to include in the export */
  includeColumns?: string[];
  /** Optional array of columns to exclude from the export */
  excludeColumns?: string[];
}

/**
 * Interface for API health check responses
 */
export interface HealthCheckResponse {
  /** Overall system health status */
  status: 'healthy' | 'degraded' | 'unhealthy';
  /** API version */
  version: string;
  /** Timestamp of when the health check was performed */
  timestamp: string;
  /** Status of individual services */
  services: Record<string, { status: 'up' | 'down', message?: string }>;
}