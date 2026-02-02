/**
 * FilterDropdown Component
 *
 * Reusable dropdown filter component for logs page.
 */

'use client'

import React, { useState } from 'react'
import { ChevronDown, Filter, Calendar, FileJson, FileCode } from 'lucide-react'

export interface DropdownOption {
  value: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
}

interface FilterDropdownProps {
  options: DropdownOption[]
  value: string
  onChange: (value: string) => void
  icon?: React.ComponentType<{ className?: string }>
  placeholder?: string
  minWidth?: string
  closeOthers?: () => void
}

export function FilterDropdown({
  options,
  value,
  onChange,
  icon: Icon = Filter,
  placeholder,
  minWidth = '160px',
  closeOthers,
}: FilterDropdownProps) {
  const [showDropdown, setShowDropdown] = useState(false)

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setShowDropdown(false)
    closeOthers?.()
  }

  const handleToggle = () => {
    setShowDropdown(!showDropdown)
    closeOthers?.()
  }

  const selectedOption = options.find((opt) => opt.value === value)
  const displayLabel = selectedOption?.label || placeholder || 'Select...'

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition min-w-[${minWidth}] justify-between"
        style={{ minWidth }}
      >
        <Icon className="w-4 h-4 text-slate-500" />
        <span className="text-sm">{displayLabel}</span>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>

      {showDropdown && (
        <div className={`absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20`} style={{ minWidth }}>
          {options.map((option) => {
            const OptionIcon = option.icon
            return (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition flex items-center gap-2 ${
                  value === option.value ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'
                }`}
              >
                {OptionIcon && <OptionIcon className="w-4 h-4" />}
                {option.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
