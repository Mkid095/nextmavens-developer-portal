'use client'

import type { CodeLanguage } from './LanguageSelector'

export interface CodeExample {
  language: CodeLanguage
  code: string
}

interface MultiLanguageCodeBlockProps {
  /**
   * Array of code examples, one for each supported language
   */
  examples: CodeExample[]

  /**
   * Currently selected language
   */
  selectedLanguage: CodeLanguage

  /**
   * Optional CSS class name for the code block
   */
  className?: string
}

/**
 * MultiLanguageCodeBlock Component
 *
 * Renders code examples that automatically switch based on the selected language.
 * If no example is provided for the selected language, it falls back to JavaScript.
 */
export default function MultiLanguageCodeBlock({
  examples,
  selectedLanguage,
  className = '',
}: MultiLanguageCodeBlockProps) {
  // Find the code example for the selected language, or fall back to JavaScript
  const example =
    examples.find((ex) => ex.language === selectedLanguage) ||
    examples.find((ex) => ex.language === 'javascript') ||
    examples[0]

  if (!example) {
    return null
  }

  return (
    <pre className={`bg-slate-900 rounded-lg p-3 overflow-x-auto ${className}`}>
      <code className="text-sm text-slate-300 font-mono whitespace-pre-wrap">
        {example.code}
      </code>
    </pre>
  )
}

/**
 * Helper function to create multi-language code examples
 *
 * @param examples - Object with language keys and code values
 * @returns Array of CodeExample objects
 */
export function createCodeExamples(
  examples: Partial<Record<CodeLanguage, string>>
): CodeExample[] {
  return Object.entries(examples).map(([language, code]) => ({
    language: language as CodeLanguage,
    code: code || '',
  }))
}
