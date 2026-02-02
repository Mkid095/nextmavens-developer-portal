/**
 * Break Glass Page Constants
 * Administrative power definitions
 */

import { Lock, CheckCircle, Eye, Trash2, KeyRound } from 'lucide-react'
import type { Power } from './types'

export const POWERS: Power[] = [
  {
    id: 'unlock',
    name: 'Unlock Suspended Project',
    description: 'Unlock a suspended project regardless of the suspension reason',
    warning:
      'This will bypass all suspension checks and set the project to ACTIVE status. Only use for false positive suspensions.',
    icon: Lock,
    endpoint: '/api/admin/projects/{id}/unlock',
    method: 'POST',
    color: 'amber',
  },
  {
    id: 'override',
    name: 'Override Suspension',
    description: 'Override auto-suspension and optionally increase hard caps',
    warning:
      'This will clear suspension flags and may increase quota limits. Use with extreme caution.',
    icon: CheckCircle,
    endpoint: '/api/admin/projects/{id}/override-suspension',
    method: 'POST',
    color: 'blue',
  },
  {
    id: 'access',
    name: 'Access Any Project',
    description: 'View full details of any project bypassing ownership checks',
    warning: 'This allows read-only access to any project on the platform. All access is logged.',
    icon: Eye,
    endpoint: '/api/admin/projects/{id}',
    method: 'GET',
    color: 'purple',
  },
  {
    id: 'force-delete',
    name: 'Force Delete Project',
    description: 'Immediately delete a project with no grace period',
    warning:
      'This will permanently delete the project and all associated resources. This action cannot be undone.',
    icon: Trash2,
    endpoint: '/api/admin/projects/{id}/force',
    method: 'DELETE',
    color: 'red',
  },
  {
    id: 'regenerate-keys',
    name: 'Regenerate System Keys',
    description: 'Invalidate all keys and generate new service_role keys',
    warning:
      'This will invalidate ALL existing API keys for the project. Applications using old keys will immediately lose access.',
    icon: KeyRound,
    endpoint: '/api/admin/projects/{id}/regenerate-keys',
    method: 'POST',
    color: 'orange',
  },
]

export const BREAK_GLASS_STORAGE_KEY = 'breakGlassSession'

export const TOAST_DURATION = 5000

export const SESSION_CHECK_INTERVAL = 1000
