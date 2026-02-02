/**
 * Docs Main Page - Module - Quick Start Component
 */

import Link from 'next/link'

const quickStartSteps = [
  {
    number: 1,
    title: 'Create an Account',
    description: 'Sign up at',
    linkText: '/register',
    linkUrl: '/register',
    code: 'https://portal.nextmavens.cloud/register',
  },
  {
    number: 2,
    title: 'Get Your API Key',
    description: 'Create an API key in the dashboard with the appropriate scopes',
    codes: ['pk_live_', 'sk_live_', 'mcp_ro_'],
  },
  {
    number: 3,
    title: 'Make Your First Request',
    description: 'Use your API key to authenticate requests',
    command: 'curl https://api.nextmavens.cloud/users \\  -H "Authorization: Bearer YOUR_API_KEY"',
  },
]

export function QuickStart() {
  return (
    <div className="bg-white rounded-xl p-8 border border-slate-200">
      <h2 className="text-2xl font-semibold text-slate-900 mb-6">Quick Start</h2>
      <div className="space-y-6">
        <QuickStartStep
          number={quickStartSteps[0].number}
          title={quickStartSteps[0].title}
          description={
            <>
              {quickStartSteps[0].description}{' '}
              <Link href={quickStartSteps[0].linkUrl} className="text-emerald-700 hover:text-emerald-800">
                {quickStartSteps[0].linkText}
              </Link>
            </>
          }
          code={quickStartSteps[0].code}
        />
        <QuickStartStep
          number={quickStartSteps[1].number}
          title={quickStartSteps[1].title}
          description={quickStartSteps[1].description}
          codes={quickStartSteps[1].codes}
        />
        <QuickStartStep
          number={quickStartSteps[2].number}
          title={quickStartSteps[2].title}
          description={quickStartSteps[2].description}
          command={quickStartSteps[2].command}
        />
      </div>
    </div>
  )
}

interface QuickStartStepProps {
  number: number
  title: string
  description: React.ReactNode
  code?: string
  codes?: string[]
  command?: string
}

function QuickStartStep({ number, title, description, code, codes, command }: QuickStartStepProps) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold text-sm">
        {number}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
        <p className="text-slate-600 mb-3">{description}</p>
        {code && <code className="text-xs bg-slate-100 px-2 py-1 rounded">{code}</code>}
        {codes && (
          <div className="flex gap-2 text-xs">
            {codes.map((c) => (
              <code key={c} className="bg-slate-100 px-2 py-1 rounded">
                {c}
              </code>
            ))}
          </div>
        )}
        {command && (
          <div className="bg-slate-900 rounded-lg p-4">
            <code
              className="text-xs text-emerald-400 block"
              dangerouslySetInnerHTML={{ __html: command }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
