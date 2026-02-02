/**
 * SoftButton Component
 *
 * A reusable button component with consistent styling.
 */

interface SoftButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  className?: string
}

export function SoftButton({ children, className = '', ...props }: SoftButtonProps) {
  return (
    <button
      className={
        'rounded-full px-5 py-2.5 text-sm font-medium shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 ' +
        'bg-emerald-900 text-white hover:bg-emerald-800 focus:ring-emerald-700 ' +
        className
      }
      {...props}
    >
      {children}
    </button>
  )
}
