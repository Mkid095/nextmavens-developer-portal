/**
 * Feature Flags Page - Utilities
 */

export function getScopeBadgeColor(scope: string): string {
  switch (scope) {
    case 'global':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'project':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'org':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200'
  }
}
