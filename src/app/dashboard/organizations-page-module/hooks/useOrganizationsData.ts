'use client'

/**
 * Organizations Page - Module - Hook for Organizations Data
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Organization } from '../types'

export function useOrganizationsData() {
  const router = useRouter()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const fetchOrganizations = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/organizations/with-stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch organizations')
      }

      const data = await response.json()
      setOrganizations(data.organizations || [])
    } catch (err) {
      console.error('Error fetching organizations:', err)
    } finally {
      setLoading(false)
    }
  }

  return {
    organizations,
    loading,
    fetchOrganizations,
  }
}
