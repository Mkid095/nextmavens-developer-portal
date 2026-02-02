/**
 * Organizations Page - Module - Hook for Create Organization
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CreateOrganizationFormState } from '../types'

interface UseCreateOrganizationReturn {
  formState: CreateOrganizationFormState
  setOrgName: (name: string) => void
  setOrgSlug: (slug: string) => void
  handleSubmit: (e: React.FormEvent) => Promise<void>
  resetForm: () => void
}

export function useCreateOrganization(
  onSuccess: () => void,
  showToast: (type: 'success' | 'error', message: string) => void
): UseCreateOrganizationReturn {
  const router = useRouter()
  const [formState, setFormState] = useState<CreateOrganizationFormState>({
    orgName: '',
    orgSlug: '',
    submitting: false,
    error: '',
  })

  const setOrgName = (name: string) => {
    setFormState(prev => ({ ...prev, orgName: name, error: '' }))
  }

  const setOrgSlug = (slug: string) => {
    setFormState(prev => ({ ...prev, orgSlug: slug, error: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormState(prev => ({ ...prev, submitting: true, error: '' }))

    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formState.orgName,
          slug: formState.orgSlug || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create organization')
      }

      showToast('success', 'Organization created successfully')
      onSuccess()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create organization'
      setFormState(prev => ({ ...prev, submitting: false, error: message }))
    } finally {
      if (!formState.error) {
        setFormState(prev => ({ ...prev, submitting: false }))
      }
    }
  }

  const resetForm = () => {
    setFormState({
      orgName: '',
      orgSlug: '',
      submitting: false,
      error: '',
    })
  }

  return {
    formState,
    setOrgName,
    setOrgSlug,
    handleSubmit,
    resetForm,
  }
}
