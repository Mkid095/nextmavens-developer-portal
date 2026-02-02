/**
 * Use Case List
 *
 * Displays a list of use cases for a token type.
 */

interface UseCaseListProps {
  useCases: string[]
  checkColor: string
}

export function UseCaseList({ useCases, checkColor }: UseCaseListProps) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-3">Use Cases</h3>
      <ul className="space-y-2">
        {useCases.map((useCase, i) => (
          <li key={i} className="flex items-start gap-2 text-slate-700">
            <span className={`${checkColor} mt-1`}>✓</span>
            <span>{useCase}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
