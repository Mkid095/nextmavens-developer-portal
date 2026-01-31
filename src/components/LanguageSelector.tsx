'use client'

import { useEffect, useState } from 'react'
import { Code2, ChevronDown, Check } from 'lucide-react'

export type CodeLanguage = 'javascript' | 'python' | 'go' | 'curl'

interface LanguageSelectorProps {
  /**
   * Current selected language
   */
  value: CodeLanguage

  /**
   * Callback when language changes
   */
  onChange: (language: CodeLanguage) => void

  /**
   * Optional label for the selector
   */
  label?: string
}

const LANGUAGE_CONFIG: Record<CodeLanguage, { label: string; icon: string }> = {
  javascript: { label: 'JavaScript', icon: 'JS' },
  python: { label: 'Python', icon: 'Py' },
  go: { label: 'Go', icon: 'Go' },
  curl: { label: 'cURL', icon: '>' },
}

const STORAGE_KEY = 'nextmavens-code-language-preference'

/**
 * Get the saved language preference from localStorage
 */
export function getSavedLanguage(): CodeLanguage {
  if (typeof window === 'undefined') return 'javascript'

  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && saved in LANGUAGE_CONFIG) {
      return saved as CodeLanguage
    }
  } catch (error) {
    console.warn('Failed to read language preference from localStorage:', error)
  }

  return 'javascript'
}

/**
 * Save language preference to localStorage
 */
export function saveLanguagePreference(language: CodeLanguage): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, language)
  } catch (error) {
    console.warn('Failed to save language preference to localStorage:', error)
  }
}

/**
 * LanguageSelector Component
 *
 * A dropdown component that allows users to select their preferred programming language
 * for code examples. The selection is persisted in localStorage for future visits.
 *
 * Supports: JavaScript, Python, Go, and cURL
 */
export default function LanguageSelector({ value, onChange, label = 'Language:' }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Ensure we only access localStorage on the client
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSelect = (language: CodeLanguage) => {
    onChange(language)
    saveLanguagePreference(language)
    setIsOpen(false)
  }

  const currentConfig = LANGUAGE_CONFIG[value]

  if (!mounted) {
    // Return a placeholder while mounting to avoid hydration mismatch
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-600">{label}</span>
        <div className="h-9 w-32 bg-slate-100 rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition min-w-[140px]"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select code example language"
      >
        <Code2 className="w-4 h-4 text-slate-600" />
        <span className="text-sm font-medium text-slate-900">{currentConfig.label}</span>
        <span className="ml-auto text-xs text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
          {currentConfig.icon}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Menu */}
          <div
            className="absolute z-20 mt-2 py-1 bg-white border border-slate-300 rounded-lg shadow-lg min-w-[180px]"
            role="listbox"
            aria-label="Select code example language"
          >
            {Object.entries(LANGUAGE_CONFIG).map(([lang, config]) => (
              <button
                key={lang}
                onClick={() => handleSelect(lang as CodeLanguage)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-100 transition text-left"
                role="option"
                aria-selected={value === lang}
              >
                <span className="text-xs text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                  {config.icon}
                </span>
                <span className="text-sm text-slate-900">{config.label}</span>
                {value === lang && (
                  <Check className="w-4 h-4 text-emerald-600 ml-auto" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/**
 * Hook to use the language selector with automatic persistence
 *
 * @returns [language, setLanguage] tuple
 */
export function useLanguageSelector(): [CodeLanguage, (language: CodeLanguage) => void] {
  const [language, setLanguageState] = useState<CodeLanguage>('javascript')

  useEffect(() => {
    // Load saved preference on mount
    const saved = getSavedLanguage()
    setLanguageState(saved)
  }, [])

  const setLanguage = (newLanguage: CodeLanguage) => {
    setLanguageState(newLanguage)
    saveLanguagePreference(newLanguage)
  }

  return [language, setLanguage]
}
