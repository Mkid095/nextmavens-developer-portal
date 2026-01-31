'use client'

import { motion } from 'framer-motion'
import CodeBlockWithCopy from '@/components/docs/CodeBlockWithCopy'

const authExamples = [
  {
    title: 'Sign Up',
    description: 'Register a new user account',
    code: `const { data, error } = await client.auth.signUp({
  email: 'user@example.com',
  password: 'secure_password',
  options: {
    data: {
      name: 'John Doe'
    }
  }
})

if (error) {
  console.error('Sign up failed:', error.message)
} else {
  console.log('User created:', data.user)
}`,
  },
  {
    title: 'Sign In',
    description: 'Authenticate a user with email and password',
    code: `const { data, error } = await client.auth.signIn({
  email: 'user@example.com',
  password: 'user_password'
})

if (error) {
  console.error('Sign in failed:', error.message)
} else {
  console.log('Signed in:', data.user)
  // Store session for subsequent requests
}`,
  },
  {
    title: 'Get Current User',
    description: 'Retrieve the currently authenticated user',
    code: `const { data: { user }, error } = await client.auth.getUser()

if (error) {
  console.error('Failed to get user:', error.message)
} else {
  console.log('Current user:', user)
}

// Check authentication status
const isAuthenticated = !!user`,
  },
  {
    title: 'Sign Out',
    description: 'Log out the current user and clear session',
    code: `const { error } = await client.auth.signOut()

if (error) {
  console.error('Sign out failed:', error.message)
} else {
  console.log('Signed out successfully')
}

// Handle sign out with redirect
const handleSignOut = async () => {
  await client.auth.signOut()
  window.location.href = '/login'
}`,
  },
  {
    title: 'Session Management',
    description: 'Manage user sessions and tokens',
    code: `const { data, error } = await client.auth.refreshSession()

// Get current session
const { data: { session } } = await client.auth.getSession()

// Check if session is valid
const isSessionValid = () => {
  const { data: { session } } = client.auth.getSession()
  return !!session && new Date(session.expires_at) > new Date()
}`,
  },
  {
    title: 'Update User',
    description: 'Update user profile and metadata',
    code: `const { data, error } = await client.auth.updateUser({
  data: {
    name: 'Jane Doe',
    avatar_url: 'https://example.com/avatar.jpg'
  }
})

// Update email
const { data } = await client.auth.updateUser({
  email: 'newemail@example.com'
})

// Update password
const { data } = await client.auth.updateUser({
  password: 'new_secure_password'
})`,
  },
  {
    title: 'Password Reset',
    description: 'Handle password reset flow',
    code: `// Request password reset email
const { data, error } = await client.auth.resetPasswordForEmail(
  'user@example.com',
  {
    redirectTo: 'https://yourapp.com/auth/reset-password'
  }
)

// Update password with reset token (from email link)
const { data, error } = await client.auth.updateUser({
  password: 'new_password'
})

// Handle password reset in your app
const handlePasswordReset = async (newPassword: string) => {
  const { data, error } = await client.auth.updateUser({
    password: newPassword
  })

  if (error) {
    console.error('Password reset failed:', error.message)
  } else {
    console.log('Password reset successful')
    // Redirect to login or dashboard
  }
}`,
  },
  {
    title: 'Error Handling',
    description: 'Handle common authentication errors',
    code: `const handleAuthError = (error: any) => {
  switch (error.message) {
    case 'Invalid login credentials':
      return 'Incorrect email or password'
    case 'Email not confirmed':
      return 'Please verify your email first'
    case 'User already registered':
      return 'An account with this email already exists'
    case 'Password should be at least 6 characters':
      return 'Password must be at least 6 characters'
    default:
      return 'An authentication error occurred'
  }
}

// Usage
const { data, error } = await client.auth.signIn({
  email: 'user@example.com',
  password: 'password'
})

if (error) {
  const userMessage = handleAuthError(error)
  console.error(userMessage)
}`,
  },
  {
    title: 'OAuth Integration',
    description: 'Set up OAuth providers for social login',
    code: `// Redirect to OAuth provider
const { data, error } = await client.auth.signIn({
  provider: 'google',
  options: {
    redirectTo: 'https://yourapp.com/auth/callback'
  }
})

// Available providers: 'google', 'github', 'gitlab', 'bitbucket'

// Handle OAuth callback
const { data, error } = await client.auth.getSession()
if (data.session) {
  // User is signed in via OAuth
  console.log('OAuth user:', data.session.user)
}`,
  },
]

export function SdkAuth() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <h2 className="text-2xl font-semibold text-slate-900 mb-6">Authentication</h2>
      <div className="space-y-6 mb-12">
        {authExamples.map((example, index) => (
          <motion.div
            key={example.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-900 mb-1">{example.title}</h3>
              <p className="text-slate-600">{example.description}</p>
            </div>
            <div className="p-6">
              <CodeBlockWithCopy>{example.code}</CodeBlockWithCopy>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
