/**
 * API Keys Documentation - Best Practices Component
 */

const BEST_PRACTICES = [
  {
    number: 1,
    title: 'Use the Right Key Type',
    description:
      'Always use public keys for client-side applications. Only use secret keys on trusted servers.',
  },
  {
    number: 2,
    title: 'Keep Keys Secret',
    description: 'Never commit keys to git, include them in client bundles, or share them publicly.',
  },
  {
    number: 3,
    title: 'Use Environment Variables',
    description:
      'Store keys in environment variables or secret management systems, never in code.',
  },
  {
    number: 4,
    title: 'Rotate Keys Regularly',
    description: 'Periodically rotate keys and revoke old ones to maintain security.',
  },
  {
    number: 5,
    title: 'Monitor Usage',
    description: 'Check key usage stats regularly to detect unusual activity or compromised keys.',
  },
]

export function BestPractices() {
  return (
    <div className="bg-white rounded-xl p-8 border border-slate-200">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">Best Practices</h2>
      <div className="space-y-4">
        {BEST_PRACTICES.map((practice) => (
          <div key={practice.number} className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-medium">
              {practice.number}
            </div>
            <div>
              <h3 className="font-medium text-slate-900 mb-1">{practice.title}</h3>
              <p className="text-sm text-slate-600">{practice.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
