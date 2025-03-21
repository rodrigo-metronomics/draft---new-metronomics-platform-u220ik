import { Response } from 'express'; // express v4.18.2
import { PaginationLinks, PaginatedResponse } from './paginationHelper';

/**
 * Formats a successful API response with data and optional message
 *
 * @param res - Express response object
 * @param data - Data to include in the response
 * @param message - Optional success message
 * @param statusCode - Optional HTTP status code (defaults to 200)
 * @returns Express response object with formatted success response
 */
export function successResponse(
  res: Response,
  data: any,
  message: string = 'Success',
  statusCode: number = 200
): Response {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

/**
 * Formats an error API response with message, optional error details, and status code
 *
 * @param res - Express response object
 * @param message - Error message
 * @param errors - Optional error details
 * @param statusCode - Optional HTTP status code (defaults to 500)
 * @returns Express response object with formatted error response
 */
export function errorResponse(
  res: Response,
  message: string = 'Internal Server Error',
  errors: any = null,
  statusCode: number = 500
): Response {
  const response: Record<string, any> = {
    success: false,
    message
  };

  if (errors) {
    response.errors = errors;
  }

  // Add request ID if available for tracing and debugging
  if (res.locals.requestId) {
    response.requestId = res.locals.requestId;
  }

  return res.status(statusCode).json(response);
}

/**
 * Formats a response for successful resource creation with 201 status code
 *
 * @param res - Express response object
 * @param data - Created resource data
 * @param message - Optional success message
 * @returns Express response object with formatted creation response
 */
export function createdResponse(
  res: Response,
  data: any,
  message: string = 'Resource created successfully'
): Response {
  return res.status(201).json({
    success: true,
    message,
    data
  });
}

/**
 * Formats a response for successful operations that don't return content with 204 status code
 *
 * @param res - Express response object
 * @returns Express response object with 204 No Content status
 */
export function noContentResponse(res: Response): Response {
  return res.status(204).send();
}

/**
 * Formats a paginated response with data, pagination metadata, and links
 *
 * @param res - Express response object
 * @param data - Array of data items
 * @param pagination - Pagination metadata
 * @param links - Navigation links for pagination
 * @param message - Optional success message
 * @returns Express response object with formatted paginated response
 */
export function paginatedResponse(
  res: Response,
  data: any[],
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  },
  links: PaginationLinks,
  message: string = 'Data retrieved successfully'
): Response {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination,
    links
  });
}