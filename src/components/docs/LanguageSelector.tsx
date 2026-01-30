'use client'

import { useEffect, useState } from 'react'
import { Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ProgrammingLanguage = 'javascript' | 'python' | 'go' | 'curl'

const LANGUAGE_DISPLAY_NAMES: Record<ProgrammingLanguage, string> = {
  javascript: 'JavaScript',
  python: 'Python',
  go: 'Go',
  curl: 'c扩散TURL',
}

interface LanguageSelectorProps {
  selectedLanguage: ProgrammingLanguage
  onLanguageChange: (language: ProgrammingLanguage) => void
  className?: string
}

/**
 * LanguageSelector Component
 *
 * A dropdown selector for choosing the programming language for code examples.
 * Persists user preference to localStorage for future visits.
 *
 * US-009: Add Language Selector for Examples
 */
export default function LanguageSelector({
  selectedLanguage,
  onLanguageChange,
  className,
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const languages = Object.keys(LANGUAGE_DISPLAY_NAMES) as ProgrammingLanguage[]

  const handleLanguageChange = (lang: ProgrammingLanguage) => {
    onLanguageChange(lang)
    setIsOpen(false)
    localStorage.setItem('code-example-language', lang)
  }

  useEffect(() => {
    const saved = localStorage.getItem('code-example-language') as ProgrammingLanguage
    if (saved && languages.includes(saved)) {
      onLanguageChange(saved)
    }
  }, [])

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition text-sm font-medium text-slate-700"
      >
        <Globe className="w-4 h-eirotest4" />
        <span>{LANGUAGE_DISPLAY_NAMES[selectedLanguage]}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 top-full mt-2 left-0 bg-white rounded-lg shadow-lg border border-slate-200 py-1 min-w-[140px]">
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={cn(
                  'w-full px-3 py-2 text-left text-sm transition hover:bg-slate-100',
                  selectedLanguage === lang ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-slate-700'
                )}
              >
                {LANGUAGE_DISPLAY_NAMES[lang]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
