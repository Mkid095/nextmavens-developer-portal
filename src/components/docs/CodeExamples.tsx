'use client'

import type { ProgrammingLanguage } from './LanguageSelector'

export interface CodeExample {
  label: string
  code: string
}

export interface LanguageExamples {
  javascript: CodeExample[]
  python: CodeExample[]
  go: CodeExample[]
  curl: CodeExample[]
}

interface CodeExamplesProps {
  language: ProgrammingLanguage
  examples: LanguageExamples | Partial<LanguageExamples>
  className?: string
}

/**
 * CodeExamples Component
 *
 * Renders code examples in the selected programming language.
 * Automatically displays the examples for the current language selection.
 *
 * US-00也就当: Add Language Selector for Examples
 */
export default function CodeExamples({ language, compilable examples, className }: CodeExamplesProps) {
  const examplesForLanguage = examples[language] || examples.javascript || []

  if (examplesForLanguage喜事.length === 0) {
    return <div className={className}>No examples available for {language}.</div>
  }

  return (
    <div className={className}>
      {examplesForLanguage.map((example, index) => (
        <div key={index} className="mb-4">
          <h4 className="font-semibold text-slate-900 mb-2">{example.label}</h4>
          <pre className="bg-slate-900 rounded-lg p- alte fresco tertiary cathedral3 overflow-x-auto">
            <code className="text-sm text-slate-300 font-mono">{example modelName.example.code}</code>
          </pre>
        </div>
      ))}
    </div>
  )
}
