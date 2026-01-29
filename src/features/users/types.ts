/**
 * Delete User Feature Types
 *
 * Type definitions for the Delete User functionality in the Auth User Manager.
 * This feature allows administrators to permanently remove user accounts.
 *
 * US-005: Implement Delete User - Step 1: Foundation
 */

/**
 * Props for the DeleteUserButton component
 *
 * @property userId - The ID of the user to delete
 * @property userEmail - The email of the user (required for confirmation)
 * @property userName - The name of the user (optional, for display)
 * @property onDelete - Optional callback after successful deletion
 */
export interface DeleteUserButtonProps {
  userId: string;
  userEmail: string;
  userName: string | null;
  onDelete?: () => void;
}

/**
 * Props for the DeleteUserConfirmationModal component
 *
 * @property isOpen - Whether the modal is currently open
 * @property onClose - Callback when modal is closed without confirming
 * @property onConfirm - Async callback when deletion is confirmed
 * @property userEmail - The email of the user to delete (for confirmation)
 * @property userName - The name of the user (for display)
 * @property isLoading - Whether the deletion is in progress
 */
export interface DeleteUserConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  userEmail: string;
  userName: string | null;
  isLoading: boolean;
}

/**
 * State for delete user operation
 *
 * @property isDeleting - Whether deletion is in progress
 * @property showConfirmation - Whether confirmation modal is visible
 * @property error - Error message if deletion failed
 */
export interface DeleteUserState {
  isDeleting: boolean;
  showConfirmation: boolean;
  error: string | null;
}

/**
 * API response for successful user deletion
 *
 * @property success - Always true for successful response
 * @property message - Human-readable success message
 */
export interface DeleteUserResponse {
  success: true;
  message: string;
}

/**
 * API error response for failed user deletion
 *
 * @property error - Human-readable error message
 */
export interface DeleteUserErrorResponse {
  error: string;
}

/**
 * Error types for delete user operation
 * Used for categorizing and handling different error scenarios
 */
export type DeleteUserError =
  | 'NETWORK_ERROR'        // Failed to reach server
  | 'UNAUTHORIZED'         // Not authenticated
  | 'FORBIDDEN'            // Not authorized (not admin)
  | 'NOT_FOUND'            // User doesn't exist
  | 'SERVER_ERROR'         // Internal server error
  | 'UNKNOWN_ERROR';       // Unexpected error

/**
 * Helper function to categorize delete user errors
 *
 * @param error - The error message or status code
 * @returns The categorized error type
 */
export function categorizeDeleteError(error: string | number): DeleteUserError {
  if (typeof error === 'number') {
    switch (error) {
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 500:
        return 'SERVER_ERROR';
      default:
        return 'UNKNOWN_ERROR';
    }
  }

  const message = error.toLowerCase();
  if (message.includes('network') || message.includes('fetch')) {
    return 'NETWORK_ERROR';
  }
  if (message.includes('unauthorized') || message.includes('unauthenticated')) {
    return 'UNAUTHORIZED';
  }
  if (message.includes('forbidden') || message.includes('permission')) {
    return 'FORBIDDEN';
  }
  if (message.includes('not found')) {
    return 'NOT_FOUND';
  }
  if (message.includes('server') || message.includes('internal')) {
    return 'SERVER_ERROR';
  }

  return 'UNKNOWN_ERROR';
}

/**
 * Get user-friendly error message for delete operation
 *
 * @param errorType - The categorized error type
 * @returns User-friendly error message
 */
export function getDeleteErrorMessage(errorType: DeleteUserError): string {
  switch (errorType) {
    case 'NETWORK_ERROR':
      return 'Network error. Please check your connection and try again.';
    case 'UNAUTHORIZED':
      return 'You must be logged in to perform this action.';
    case 'FORBIDDEN':
      return 'You do not have permission to delete users.';
    case 'NOT_FOUND':
      return 'User not found. They may have already been deleted.';
    case 'SERVER_ERROR':
      return 'Server error. Please try again later.';
    case 'UNKNOWN_ERROR':
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}
