/**
 * Status Page - Module - Incident Filter Hook
 */

import { useMemo } from 'react'
import type { StatusResponse, Incident } from '../types'

export function useIncidentFilter(statusData: StatusResponse | null) {
  return useMemo(() => {
    if (!statusData) {
      return { activeIncidents: [], resolvedIncidents: [] }
    }

    return {
      activeIncidents: statusData.incidents.filter((i) => i.status === 'active'),
      resolvedIncidents: statusData.incidents.filter((i) => i.status === 'resolved'),
    }
  }, [statusData])
}
