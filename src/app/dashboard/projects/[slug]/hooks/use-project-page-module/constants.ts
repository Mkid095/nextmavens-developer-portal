/**
 * Project Page Hook - Module - Constants
 */

export const DEFAULT_TAB = 'overview' as const

export const MODAL_INITIAL_STATES = {
  showCreateKeyModal: false,
  keySubmitting: false,
  keyError: '',
  showRotateModal: false,
  rotateSubmitting: false,
  showRevokeModal: false,
  revokeSubmitting: false,
  selectedKeyId: null,
  newKey: null,
  showUsageExamples: false,
  showDeleteModal: false,
  deleteSubmitting: false,
  showSupportModal: false,
  selectedRequestId: null,
  showDetailModal: false,
  supportStatusFilter: 'all',
  showSecret: {},
} as const

export const API_ENDPOINTS = {
  CREATE_KEY: '/api/api-keys',
  ROTATE_KEY: (id: string) => `/api/keys/${id}/rotate`,
  REVOKE_KEY: (id: string) => `/api/keys/${id}/revoke`,
  DELETE_KEY: (id: string) => `/api/api-keys?id=${id}`,
  DELETE_PROJECT: (id: string) => `/api/projects/${id}`,
} as const
