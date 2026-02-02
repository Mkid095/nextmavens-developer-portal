/**
 * Create Secret Modal - Custom Hook
 *
 * Form state management and validation logic.
 */

import { useState, useEffect, useCallback } from 'react'
import type { CreateSecretRequest } from '@/lib/types/secrets.types'
import type { FormState } from '../types'
import { validateName, validateValue } from '../validation'

export function useSecretForm(
  isOpen: boolean,
  projectId: string,
  onCreate: (data: CreateSecretRequest) => Promise<void>,
  onClose: () => void
) {
  const [formState, setFormState] = useState<FormState>({
    name: '',
    value: '',
    showValue: false,
    submitting: false,
    error: '',
    createdSecret: null,
  })

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormState({
        name: '',
        value: '',
        showValue: false,
        error: '',
        createdSecret: null,
        submitting: false,
      })
    }
  }, [isOpen])

  const setName = useCallback((name: string) => {
    setFormState(prev => ({ ...prev, name }))
  }, [])

  const setValue = useCallback((value: string) => {
    setFormState(prev => ({ ...prev, value }))
  }, [])

  const setShowValue = useCallback((showValue: boolean) => {
    setFormState(prev => ({ ...prev, showValue }))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const nameValidation = validateName(formState.name)
    if (!nameValidation.valid) {
      setFormState(prev => ({ ...prev, error: nameValidation.error! }))
      return
    }

    const valueValidation = validateValue(formState.value)
    if (!valueValidation.valid) {
      setFormState(prev => ({ ...prev, error: valueValidation.error! }))
      return
    }

    setFormState(prev => ({ ...prev, submitting: true, error: '' }))

    try {
      await onCreate({
        project_id: projectId,
        name: formState.name,
        value: formState.value,
      })

      // Show success state with the value (one-time display)
      setFormState(prev => ({
        ...prev,
        createdSecret: { name: prev.name, value: prev.value },
        name: '',
        value: '',
        submitting: false,
      }))
    } catch (err: any) {
      setFormState(prev => ({
        ...prev,
        error: err.message || 'Failed to create secret',
        submitting: false,
      }))
    }
  }

  const handleClose = useCallback(() => {
    if (!formState.submitting) {
      onClose()
    }
  }, [formState.submitting, onClose])

  const handleCopyValue = useCallback(() => {
    if (formState.createdSecret?.value) {
      navigator.clipboard.writeText(formState.createdSecret.value)
    }
  }, [formState.createdSecret])

  return {
    formState,
    setName,
    setValue,
    setShowValue,
    handleSubmit,
    handleClose,
    handleCopyValue,
  }
}
