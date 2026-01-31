/**
 * Component Tests for DeleteSecretModal
 *
 * Tests the delete secret confirmation modal.
 */

import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DeleteSecretModal from '../DeleteSecretModal'
import type { Secret } from '@/lib/types/secrets.types'

describe('DeleteSecretModal', () => {
  const mockSecret: Secret = {
    id: 'secret-123',
    project_id: 'project-123',
    name: 'DATABASE_URL',
    version: 3,
    active: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  }

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn().mockResolvedValue(undefined),
    secret: mockSecret,
  }

  it('should not render when isOpen is false', () => {
    const { container } = render(<DeleteSecretModal {...defaultProps} isOpen={false} />)
    expect(container.firstChild).toBeNull()
  })

  it('should not render when secret is null', () => {
    const { container } = render(<DeleteSecretModal {...defaultProps} secret={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('should render modal when open with secret', () => {
    render(<DeleteSecretModal {...defaultProps} />)

    expect(screen.getByText('Delete Secret')).toBeInTheDocument()
    expect(screen.getByText('This action cannot be undone')).toBeInTheDocument()
  })

  it('should display secret name', () => {
    const { container } = render(<DeleteSecretModal {...defaultProps} />)

    // The secret name appears in multiple places, use getAllByText
    expect(screen.getAllByText(mockSecret.name).length).toBeGreaterThan(0)
  })

  it('should display secret version', () => {
    render(<DeleteSecretModal {...defaultProps} />)

    // Version appears as "v3"
    expect(screen.getAllByText(`v${mockSecret.version}`).length).toBeGreaterThan(0)
  })

  it('should display Active status for active secret', () => {
    render(<DeleteSecretModal {...defaultProps} />)

    expect(screen.getAllByText('Active').length).toBeGreaterThan(0)
  })

  it('should display Inactive status for inactive secret', () => {
    const inactiveSecret = { ...mockSecret, active: false }
    render(<DeleteSecretModal {...defaultProps} secret={inactiveSecret} />)

    expect(screen.getAllByText('Inactive').length).toBeGreaterThan(0)
  })

  it('should call onClose when Cancel is clicked', async () => {
    const user = userEvent.setup({ delay: null })
    const mockOnClose = vi.fn()

    render(<DeleteSecretModal {...defaultProps} onClose={mockOnClose} />)

    const cancelButton = screen.getByText('Cancel')
    await user.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should show confirmation checkbox after clicking Delete', async () => {
    const user = userEvent.setup({ delay: null })

    render(<DeleteSecretModal {...defaultProps} />)

    const deleteButton = screen.getByText('Delete')
    await user.click(deleteButton)

    expect(screen.getByText('Confirm Delete')).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
  })

  it('should not enable Confirm Delete until checkbox is checked', async () => {
    const user = userEvent.setup({ delay: null })

    render(<DeleteSecretModal {...defaultProps} />)

    await user.click(screen.getByText('Delete'))

    const confirmButton = screen.getByText('Confirm Delete')
    expect(confirmButton).toBeDisabled()

    const checkbox = screen.getByRole('checkbox')
    await user.click(checkbox)

    expect(confirmButton).toBeEnabled()
  })
})
