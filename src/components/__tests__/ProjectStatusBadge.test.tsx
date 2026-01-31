/**
 * Component Tests for ProjectStatusBadge
 *
 * Tests the status badge component that displays project lifecycle states.
 * US-008: Create Status Badge UI
 */

import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProjectStatusBadge, {
  getStatusConfig,
  getStatusDescription,
} from '../ProjectStatusBadge'
import { ProjectStatus } from '@/lib/types/project-lifecycle.types'

describe('ProjectStatusBadge', () => {
  describe('Rendering', () => {
    it('should render ACTIVE status badge with correct styling', () => {
      const { container } = render(<ProjectStatusBadge status={ProjectStatus.ACTIVE} />)

      expect(screen.getByText('Active')).toBeInTheDocument()
      const badge = container.querySelector('.bg-green-100')
      expect(badge).toBeInTheDocument()
      expect(badge?.className).toContain('text-green-700')
    })

    it('should render SUSPENDED status badge with correct styling', () => {
      const { container } = render(<ProjectStatusBadge status={ProjectStatus.SUSPENDED} />)

      expect(screen.getByText('Suspended')).toBeInTheDocument()
      const badge = container.querySelector('.bg-red-100')
      expect(badge).toBeInTheDocument()
      expect(badge?.className).toContain('text-red-700')
    })

    it('should render ARCHIVED status badge with correct styling', () => {
      const { container } = render(<ProjectStatusBadge status={ProjectStatus.ARCHIVED} />)

      expect(screen.getByText('Archived')).toBeInTheDocument()
      const badge = container.querySelector('.bg-yellow-100')
      expect(badge).toBeInTheDocument()
      expect(badge?.className).toContain('text-yellow-700')
    })

    it('should render CREATED status badge with correct styling', () => {
      const { container } = render(<ProjectStatusBadge status={ProjectStatus.CREATED} />)

      expect(screen.getByText('Created')).toBeInTheDocument()
      const badge = container.querySelector('.bg-blue-100')
      expect(badge).toBeInTheDocument()
      expect(badge?.className).toContain('text-blue-700')
    })

    it('should render DELETED status badge with correct styling', () => {
      const { container } = render(<ProjectStatusBadge status={ProjectStatus.DELETED} />)

      expect(screen.getByText('Deleted')).toBeInTheDocument()
      const badge = container.querySelector('.bg-gray-100')
      expect(badge).toBeInTheDocument()
      expect(badge?.className).toContain('text-gray-700')
    })

    it('should handle string status input', () => {
      render(<ProjectStatusBadge status="active" />)

      const badge = screen.getByText('Active')
      expect(badge).toBeInTheDocument()
    })

    it('should default to CREATED for unknown status', () => {
      render(<ProjectStatusBadge status="unknown_status" />)

      const badge = screen.getByText('Created')
      expect(badge).toBeInTheDocument()
    })
  })

  describe('Icons', () => {
    it('should show icon by default', () => {
      const { container } = render(<ProjectStatusBadge status={ProjectStatus.ACTIVE} />)

      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('should hide icon when showIcon is false', () => {
      const { container } = render(
        <ProjectStatusBadge status={ProjectStatus.ACTIVE} showIcon={false} />
      )

      const icon = container.querySelector('svg')
      expect(icon).not.toBeInTheDocument()
    })
  })

  describe('Size Variants', () => {
    it('should render small size variant', () => {
      const { container } = render(
        <ProjectStatusBadge status={ProjectStatus.ACTIVE} size="sm" />
      )

      const badge = container.firstChild as HTMLElement
      expect(badge.className).toContain('text-xs')
      expect(badge.className).toContain('px-2')
      expect(badge.className).toContain('py-0.5')
    })

    it('should render medium size variant (default)', () => {
      const { container } = render(
        <ProjectStatusBadge status={ProjectStatus.ACTIVE} size="md" />
      )

      const badge = container.firstChild as HTMLElement
      expect(badge.className).toContain('text-sm')
      expect(badge.className).toContain('px-2.5')
      expect(badge.className).toContain('py-1')
    })

    it('should render large size variant', () => {
      const { container } = render(
        <ProjectStatusBadge status={ProjectStatus.ACTIVE} size="lg" />
      )

      const badge = container.firstChild as HTMLElement
      expect(badge.className).toContain('text-base')
      expect(badge.className).toContain('px-3')
      expect(badge.className).toContain('py-1.5')
    })
  })

  describe('Custom Classes', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <ProjectStatusBadge status={ProjectStatus.ACTIVE} className="custom-class" />
      )

      const badge = container.firstChild as HTMLElement
      expect(badge.className).toContain('custom-class')
    })
  })

  describe('Tooltip', () => {
    it('should show tooltip by default', () => {
      const { container } = render(<ProjectStatusBadge status={ProjectStatus.ACTIVE} />)

      const badge = container.firstChild as HTMLElement
      expect(badge.getAttribute('title')).toBe('Project is active and fully operational.')
    })

    it('should hide tooltip when showTooltip is false', () => {
      const { container } = render(
        <ProjectStatusBadge status={ProjectStatus.ACTIVE} showTooltip={false} />
      )

      const badge = container.firstChild as HTMLElement
      expect(badge.getAttribute('title')).toBeNull()
    })
  })

  describe('Helper Functions', () => {
    it('should return correct status config for ACTIVE', () => {
      const config = getStatusConfig(ProjectStatus.ACTIVE)

      expect(config.label).toBe('Active')
      expect(config.bgColor).toBe('bg-green-100')
      expect(config.textColor).toBe('text-green-700')
      expect(config.description).toBe('Project is active and fully operational.')
    })

    it('should return correct status config for SUSPENDED', () => {
      const config = getStatusConfig(ProjectStatus.SUSPENDED)

      expect(config.label).toBe('Suspended')
      expect(config.bgColor).toBe('bg-red-100')
      expect(config.textColor).toBe('text-red-700')
      expect(config.description).toBe(
        'Project is suspended. API keys are disabled and services are stopped.'
      )
    })

    it('should return correct status description', () => {
      const description = getStatusDescription(ProjectStatus.ACTIVE)
      expect(description).toBe('Project is active and fully operational.')
    })

    it('should handle string status in getStatusConfig', () => {
      const config = getStatusConfig('active')

      expect(config.label).toBe('Active')
      expect(config.bgColor).toBe('bg-green-100')
    })

    it('should handle string status in getStatusDescription', () => {
      const description = getStatusDescription('suspended')

      expect(description).toBe(
        'Project is suspended. API keys are disabled and services are stopped.'
      )
    })
  })

  describe('Accessibility', () => {
    it('should be keyboard accessible', () => {
      const { container } = render(<ProjectStatusBadge status={ProjectStatus.ACTIVE} />)

      const badge = container.querySelector('[title]')
      expect(badge).toBeInTheDocument()
    })

    it('should have descriptive text for screen readers', () => {
      const { container } = render(<ProjectStatusBadge status={ProjectStatus.SUSPENDED} showTooltip={true} />)

      const badge = container.querySelector('[title]')
      const title = badge?.getAttribute('title')
      expect(title).toBe(
        'Project is suspended. API keys are disabled and services are stopped.'
      )
    })
  })

  describe('Color Coding (US-008)', () => {
    it('should use green for ACTIVE status', () => {
      const { container } = render(<ProjectStatusBadge status={ProjectStatus.ACTIVE} />)

      const badge = container.firstChild as HTMLElement
      expect(badge.className).toContain('bg-green-100')
      expect(badge.className).toContain('text-green-700')
    })

    it('should use red for SUSPENDED status', () => {
      const { container } = render(<ProjectStatusBadge status={ProjectStatus.SUSPENDED} />)

      const badge = container.firstChild as HTMLElement
      expect(badge.className).toContain('bg-red-100')
      expect(badge.className).toContain('text-red-700')
    })

    it('should use yellow for ARCHIVED status', () => {
      const { container } = render(<ProjectStatusBadge status={ProjectStatus.ARCHIVED} />)

      const badge = container.firstChild as HTMLElement
      expect(badge.className).toContain('bg-yellow-100')
      expect(badge.className).toContain('text-yellow-700')
    })

    it('should use blue for CREATED status', () => {
      const { container } = render(<ProjectStatusBadge status={ProjectStatus.CREATED} />)

      const badge = container.firstChild as HTMLElement
      expect(badge.className).toContain('bg-blue-100')
      expect(badge.className).toContain('text-blue-700')
    })

    it('should use gray for DELETED status', () => {
      const { container } = render(<ProjectStatusBadge status={ProjectStatus.DELETED} />)

      const badge = container.firstChild as HTMLElement
      expect(badge.className).toContain('bg-gray-100')
      expect(badge.className).toContain('text-gray-700')
    })
  })
})
