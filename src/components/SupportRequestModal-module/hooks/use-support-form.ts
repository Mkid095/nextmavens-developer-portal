/**
 * Support Request Modal - Custom Hook
 *
 * Form state management and submission logic.
 */

import { useState, useCallback, useEffect } from 'react'
import type { FormState, ModalState, SubmitResponse } from '../types'

export function useSupportForm(isOpen: boolean, projectId: string, projectName: string, onClose: () => void) {
  const [formState, setFormState] = useState<FormState>({
    subject: '',
    description: '',
    error: '',
    success: false,
    submitting: false,
    requestId: null,
  })

  const [modalState, setModalState] = useState<ModalState>({
    context: null,
    loadingContext: false,
  })

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormState({
        subject: '',
        description: '',
        error: '',
        success: false,
        requestId: null,
        submitting: false,
      })
      loadContext()
    }
  }, [isOpen, projectId])

  const loadContext = async () => {
    setModalState(prev => ({ ...prev, loadingContext: true }))
    try {
      // We'll show what context will be attached based on the API documentation
      setModalState({
        context: {
          project: {
            id: projectId,
            name: projectName,
            status: 'active',
            tenant_slug: 'your-tenant',
          },
          recent_errors: [],
          usage_metrics: {},
          logs_snippet: [],
        },
        loadingContext: false,
      })
    } catch (err) {
      console.error('Failed to load context:', err)
      setModalState(prev => ({ ...prev, loadingContext: false }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formState.subject.trim() || formState.description.length < 10) {
      setFormState(prev => ({
        ...prev,
        error: 'Please provide a subject and a description (at least 10 characters)',
      }))
      return
    }

    setFormState(prev => ({ ...prev, submitting: true, error: '' }))

    try {
      const response = await fetch('/api/support/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: projectId,
          subject: formState.subject.trim(),
          description: formState.description.trim(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create support request')
      }

      const data: SubmitResponse = await response.json()
      setFormState(prev => ({
        ...prev,
        submitting: false,
        success: true,
        requestId: data.request_id,
      }))
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setFormState(prev => ({
        ...prev,
        submitting: false,
        error: errorMessage,
      }))
    }
  }

  const handleClose = useCallback(() => {
    onClose()
    // Reset after animation completes
    setTimeout(() => {
      setFormState({
        subject: '',
        description: '',
        error: '',
        success: false,
        requestId: null,
        submitting: false,
      })
    }, 300)
  }, [onClose])

  const setSubject = useCallback((subject: string) => {
    setFormState(prev => ({ ...prev, subject }))
  }, [])

  const setDescription = useCallback((description: string) => {
    setFormState(prev => ({ ...prev, description }))
  }, [])

  return {
    formState,
    modalState,
    handleSubmit,
    handleClose,
    setSubject,
    setDescription,
  }
}
