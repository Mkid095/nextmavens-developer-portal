/**
 * User Detail View Types
 *
 * Type definitions for the user detail view component.
 * These types match the user structure from the auth service database.
 *
 * US-003: Create User Detail View
 */

/**
 * User information from the developers table
 */
export interface User {
  id: string;
  email: string;
  name: string | null;
  organization: string | null;
  role: 'developer' | 'operator' | 'admin';
  created_at: string;
  updated_at: string | null;
}

/**
 * Auth information from the auth service
 * This maps to the users table in the auth database
 */
export interface AuthInfo {
  user_id: string;
  email: string;
  name: string | null;
  tenant_id: string;
  role: 'owner' | 'admin' | 'member';
  is_verified: boolean;
  last_login_at: string | null;
  sign_in_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Authentication provider information
 */
export type AuthProvider = 'email' | 'oauth_google' | 'oauth_github' | 'oauth_gitlab';

/**
 * Complete user detail information
 * Combines developer table data with auth info
 */
export interface UserDetail extends User {
  auth_info: AuthInfo | null;
  auth_provider: AuthProvider;
  user_metadata: Record<string, unknown>;
}

/**
 * API response for user detail endpoint
 */
export interface UserDetailResponse {
  user: UserDetail;
}

/**
 * Metadata editor state
 */
export interface MetadataEditorState {
  isEditing: boolean;
  jsonError: string | null;
  editedMetadata: string;
}

/**
 * Props for UserDetail component
 */
export interface UserDetailProps {
  userId: string;
}
