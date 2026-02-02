/**
 * Use Service Status Hook
 */

import { useState, useCallback } from 'react'
import type { ServiceType, ServiceStatus } from '@/lib/types/service-status.types'

export function useServiceStatus(): {
  serviceStatuses: Record<string, ServiceStatus>
  updatingService: ServiceType | null
  handleToggleService: (service: ServiceType, newStatus: ServiceStatus) => Promise<void>
} {
  const [serviceStatuses, setServiceStatuses] = useState<Record<string, ServiceStatus>>({
    database: 'enabled',
    auth: 'enabled',
    storage: 'enabled',
    realtime: 'enabled',
    graphql: 'enabled',
  })
  const [updatingService, setUpdatingService] = useState<ServiceType | null>(null)

  const handleToggleService = useCallback(async (service: ServiceType, newStatus: ServiceStatus) => {
    if (updatingService) return

    // Confirm before disabling
    if (newStatus === 'disabled') {
      const confirmed = confirm(`Are you sure you want to disable the ${service} service? This may affect your application.`)
      if (!confirmed) return
    }

    setUpdatingService(service)
    try {
      // Simulate provisioning state when enabling
      if (newStatus === 'enabled') {
        setServiceStatuses((prev) => ({
          ...prev,
          [service]: 'provisioning',
        }))

        // Simulate provisioning delay (2 seconds)
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }

      setServiceStatuses((prev) => ({
        ...prev,
        [service]: newStatus,
      }))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : `Failed to ${newStatus === 'enabled' ? 'enable' : 'disable'} ${service} service`
      console.error(`Failed to toggle ${service} service:`, err)
      alert(message)
    } finally {
      setUpdatingService(null)
    }
  }, [updatingService])

  return { serviceStatuses, updatingService, handleToggleService }
}
