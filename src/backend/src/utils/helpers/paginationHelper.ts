import { Request } from 'express'; // express v4.18.2

/**
 * Default pagination parameters
 */
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

/**
 * Interface for pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

/**
 * Interface for pagination navigation links
 */
export interface PaginationLinks {
  self: string;
  first: string;
  prev: string | null;
  next: string | null;
  last: string;
}

/**
 * Interface for standardized paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  links: PaginationLinks;
}

/**
 * Extracts and validates pagination parameters from request query parameters
 * 
 * @param query - Query parameters object from the request
 * @returns Validated pagination parameters with defaults applied
 */
export function parsePaginationParams(query: Record<string, any>): PaginationParams {
  // Extract page and limit from query parameters
  const pageParam = query.page;
  const limitParam = query.limit;

  // Convert to numbers and apply defaults if invalid
  const page = Math.max(parseInt(pageParam as string, 10) || DEFAULT_PAGE, 1);
  
  // Ensure limit is between 1 and MAX_LIMIT
  let limit = parseInt(limitParam as string, 10) || DEFAULT_LIMIT;
  limit = Math.max(1, Math.min(limit, MAX_LIMIT));
  
  // Calculate offset for database queries
  const offset = (page - 1) * limit;
  
  return {
    page,
    limit,
    offset
  };
}

/**
 * Creates pagination links for navigating through paginated results
 * 
 * @param req - Express request object
 * @param pagination - Current pagination parameters
 * @param total - Total number of items
 * @returns Object containing pagination links
 */
export function createPaginationLinks(
  req: Request,
  pagination: PaginationParams,
  total: number
): PaginationLinks {
  const { page, limit } = pagination;
  
  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(total / limit));
  
  // Extract base URL from request
  const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`;
  
  // Create query string function to append to URLs
  const createQueryString = (page: number, limit: number): string => {
    const query = new URLSearchParams(req.query as any);
    query.set('page', page.toString());
    query.set('limit', limit.toString());
    return `${baseUrl}?${query.toString()}`;
  };
  
  // Create pagination links
  const links: PaginationLinks = {
    self: createQueryString(page, limit),
    first: createQueryString(1, limit),
    prev: page > 1 ? createQueryString(page - 1, limit) : null,
    next: page < totalPages ? createQueryString(page + 1, limit) : null,
    last: createQueryString(totalPages, limit)
  };
  
  return links;
}

/**
 * Creates a standardized paginated response object
 * 
 * @param data - Array of data items
 * @param pagination - Current pagination parameters
 * @param total - Total number of items
 * @param req - Express request object
 * @returns Standardized paginated response object
 */
export function createPaginatedResponse<T>(
  data: T[],
  pagination: PaginationParams,
  total: number,
  req: Request
): PaginatedResponse<T> {
  const { page, limit } = pagination;
  
  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(total / limit));
  
  // Create pagination links
  const links = createPaginationLinks(req, pagination, total);
  
  // Create standardized response
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages
    },
    links
  };
}

/**
 * Applies pagination parameters to a Prisma query
 * 
 * @param query - Prisma query object
 * @param pagination - Pagination parameters
 * @returns Query with pagination applied
 */
export function applyPagination<T extends Record<string, any>>(
  query: T,
  pagination: PaginationParams
): T {
  // Add skip and take parameters for pagination
  return {
    ...query,
    skip: pagination.offset,
    take: pagination.limit
  };
}