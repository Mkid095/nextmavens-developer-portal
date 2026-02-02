/**
 * API Keys Tab - Constants
 */

export const INTEGRATION_CODE_EXAMPLE = `const response = await fetch('https://api.nextmavens.cloud/api/projects/PROJECT_ID/users', {
  headers: {
    'X-API-Key': process.env.NEXTMAVENS_API_KEY
  }
})
const data = await response.json()`

export const SECURITY_BEST_PRACTICES = [
  'Never commit API keys to public repositories',
  'Use environment variables to store keys',
  'Rotate keys regularly (use the rotate button)',
  'Revoke unused keys immediately',
  'Use publishable keys in frontend code only',
]

export const KEY_TYPE_DESCRIPTIONS = {
  publishable: {
    title: 'publishable',
    color: 'emerald',
    description: 'Safe for client-side code. Can only read data and create resources.',
    useFor: 'Frontend apps, mobile apps, public APIs',
  },
  secret: {
    title: 'secret',
    color: 'blue',
    description: 'Full access to all operations. Never expose in client-side code.',
    useFor: 'Backend servers, CLI tools, scripts',
  },
  service_role: {
    title: 'service_role',
    color: 'purple',
    description: 'Bypasses row-level security. Use with extreme caution.',
    useFor: 'Admin tasks, migrations, trusted services',
  },
} as const
