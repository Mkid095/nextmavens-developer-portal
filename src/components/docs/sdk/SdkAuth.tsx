'use client'

import { motion } from 'framer-motion'
import CodeBlockWithCopy from '@/components/docs/CodeBlockWithCopy'

const authExamples = [
  {
    title: 'Sign Up',
    description: 'Register a new user account',
    code: `const response = await fetch('https://api.nextmavens.cloud/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'secure_password',
    name: 'John Doe'
  })
});

const { data, error } = await response.json();

if (error) {
  console.error('Sign up failed:', error.message)
} else {
  console.log('User created:', data.user)
  console.log('Access token:', data.accessToken)
}`,
  },
  {
    title: 'Sign In',
    description: 'Authenticate a user with email and password',
    code: `const response = await fetch('https://api.nextmavens.cloud/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'user_password'
  })
});

const { data, error } = await response.json();

if (error) {
  console.error('Sign in failed:', error.message)
} else {
  console.log('Signed in:', data.user)
  // Store tokens for subsequent requests
  localStorage.setItem('accessToken', data.accessToken)
  localStorage.setItem('refreshToken', data.refreshToken)
}`,
  },
  {
    title: 'Get Current User',
    description: 'Retrieve the currently authenticated user',
    code: `const response = await fetch('https://api.nextmavens.cloud/api/auth/me', {
  method: 'GET',
  headers: {
    'Authorization': \`Bearer \${localStorage.getItem('accessToken')}\`
  }
});

const { data, error } = await response.json();

if (error) {
  console.error('Failed to get user:', error.message)
} else {
  console.log('Current user:', data.user)
}`,
  },
  {
    title: 'Refresh Token',
    description: 'Get a new access token using refresh token',
    code: `const response = await fetch('https://api.nextmavens.cloud/api/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    refreshToken: localStorage.getItem('refreshToken')
  })
});

const { data, error } = await response.json();

if (error) {
  console.error('Token refresh failed:', error.message)
  // Redirect to login
} else {
  // Update stored access token
  localStorage.setItem('accessToken', data.accessToken)
}`,
  },
  {
    title: 'Sign Out',
    description: 'Log out the current user and clear session',
    code: `const response = await fetch('https://api.nextmavens.cloud/api/auth/logout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    refreshToken: localStorage.getItem('refreshToken')
  })
});

const { data, error } = await response.json();

if (error) {
  console.error('Sign out failed:', error.message)
} else {
  // Clear stored tokens
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  // Redirect to login
  window.location.href = '/login'
}`,
  },
  {
    title: 'Error Handling',
    description: 'Handle common authentication errors',
    code: `const handleAuthError = (error: any) => {
  switch (error?.message) {
    case 'Invalid credentials':
      return 'Incorrect email or password'
    case 'User already exists':
      return 'An account with this email already exists'
    case 'Password too weak':
      return 'Password must be at least 8 characters'
    case 'Invalid token':
      return 'Session expired. Please sign in again.'
    default:
      return 'An authentication error occurred'
  }
}

// Usage
try {
  const response = await fetch('https://api.nextmavens.cloud/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const { data, error } = await response.json();

  if (error) {
    const userMessage = handleAuthError(error)
    console.error(userMessage)
  }
} catch (err) {
  console.error('Network error:', err)
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
      <p className="text-slate-600 mb-6">
        Use the REST API endpoints for authentication. Store access and refresh tokens securely
        and include the access token in the Authorization header for authenticated requests.
      </p>
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
