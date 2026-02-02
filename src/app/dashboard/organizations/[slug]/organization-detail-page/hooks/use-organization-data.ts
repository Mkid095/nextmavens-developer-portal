/**
 * Organization Detail Page - Custom Hook
 *
 * Data fetching hook for organization and projects data.
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Organization, Project, Toast } from '../types'

export function useOrganizationData(slug: string) {
  const router = useRouter()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    if (slug) {
      fetchOrganization()
    }
  }, [slug])

  useEffect(() => {
    if (organization?.id) {
      fetchProjects()
    }
  }, [organization])

  const fetchOrganization = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        router.push('/login')
        return
      }

      // First get all organizations to find the one with this slug
      const response = await fetch('/api/organizations/with-stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch organization')
      }

      const data = await response.json()
      const org = (data.organizations || []).find((o: Organization) => o.slug === slug)

      if (!org) {
        throw new Error('Organization not found')
      }

      // Get detailed organization info including members
      const detailResponse = await fetch(`/api/organizations/${org.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (detailResponse.ok) {
        const detailData = await detailResponse.json()
        setOrganization(detailData.data || org)
      } else {
        setOrganization(org)
      }
    } catch (err) {
      console.error('Error fetching organization:', err)
      showToast('error', 'Failed to load organization')
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        return
      }

      const response = await fetch(`/api/projects?organization_id=${organization?.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      }
    } catch (err) {
      console.error('Error fetching projects:', err)
    }
  }

  const showToast = (type: 'success' | 'error', message: string) => {
    const id = Math.random().toString(36).substring(7)
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)
  }

  return {
    organization,
    projects,
    loading,
    toasts,
    setToasts,
    showToast,
    fetchProjects,
  }
}
