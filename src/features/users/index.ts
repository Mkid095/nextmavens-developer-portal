/**
 * Delete User Feature Exports
 *
 * US-005: Implement Delete User - Step 1: Foundation
 *
 * This file re-exports all public types and utilities for the Delete User feature.
 */

// Types
export type {
  DeleteUserButtonProps,
  DeleteUserConfirmationModalProps,
  DeleteUserState,
  DeleteUserResponse,
  DeleteUserErrorResponse,
  DeleteUserError,
} from './types';

// Utility functions
export {
  categorizeDeleteError,
  getDeleteErrorMessage,
} from './types';

// Components will be exported here in Step 5
// export { DeleteUserButton } from './components/DeleteUserButton';
// export { DeleteUserConfirmationModal } from './components/DeleteUserConfirmationModal';
