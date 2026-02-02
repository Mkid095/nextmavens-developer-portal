/**
 * Provisioning Progress Constants
 */

export const STEP_LABELS: Record<string, string> = {
  create_tenant_database: 'Create Tenant Database',
  create_tenant_schema: 'Create Tenant Schema',
  register_auth_service: 'Register Auth Service',
  register_realtime_service: 'Register Realtime Service',
  register_storage_service: 'Register Storage Service',
  generate_api_keys: 'Generate API Keys',
  verify_services: 'Verify Services',
}

export const STATUS_BADGES = {
  success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  running: 'bg-blue-100 text-blue-700 border-blue-200',
  failed: 'bg-red-100 text-red-700 border-red-200',
  skipped: 'bg-gray-100 text-gray-600 border-gray-200',
  pending: 'bg-gray-50 text-gray-500 border-gray-200',
} as const

export const STATUS_LABELS = {
  success: 'Completed',
  running: 'Running',
  failed: 'Failed',
  skipped: 'Skipped',
  pending: 'Pending',
} as const
