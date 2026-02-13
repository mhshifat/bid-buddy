/**
 * Standard API response wrapper types.
 * These types are used across the application for consistent API responses.
 */

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    correlationId: string;
    fieldErrors?: Record<string, string[]>;
  };
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Pagination types used for list endpoints.
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Sort and filter types.
 */
export type SortDirection = "asc" | "desc";

export interface SortParams {
  field: string;
  direction: SortDirection;
}

export interface FilterParams {
  [key: string]: string | number | boolean | string[] | undefined;
}

