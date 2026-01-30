/**
 * Organization Types
 *
 * Type definitions for the organizations feature.
 * These types match the organizations table structure in the control_plane schema.
 *
 * US-001: Create Organizations Table
 */

/**
 * Organization database record
 * Matches the control_plane.organizations table structure
 */
export interface Organization {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  created_at: Date | string; // Date object or ISO 8601 string
}

/**
 * Organization API response
 * Matches the response from POST /api/organizations and GET /api/organizations
 */
export interface OrganizationApiResponse {
  data: Organization;
}

/**
 * Organization list API response
 * Matches the response from GET /api/organizations (list view)
 */
export interface OrganizationListApiResponse {
  data: Organization[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

/**
 * Request body for creating an organization
 * Matches POST /api/organizations request
 */
export interface CreateOrganizationRequest {
  name: string;
  slug?: string; // Optional - will be auto-generated if not provided
}

/**
 * Query parameters for fetching organizations
 */
export interface OrganizationQueryParams {
  limit?: number;
  offset?: number;
  search?: string; // Search by name or slug
}

/**
 * Filter state for the organizations list
 */
export interface OrganizationFilters {
  search: string;
}

/**
 * Validation error response
 */
export interface OrganizationValidationError {
  field: string;
  message: string;
}

/**
 * Organization with member count (for list view)
 */
export interface OrganizationWithStats extends Organization {
  member_count?: number;
  project_count?: number;
}
