'use client'

import Link from 'next/link'
import { Code2, ArrowLeft, ArrowRight, Download, Github, FileText, Copy, Check, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'

const installMethods = [
  {
    name: 'npm',
    command: 'npm install nextmavens-js',
  },
  {
    name: 'yarn',
    command: 'yarn add nextmavens-js',
  },
  {
    name: 'pnpm',
    command: 'pnpm add nextmavens-js',
  },
]

const databaseExamples = [
  {
    title: 'Select Data',
    description: 'Retrieve data from a table with various filtering and sorting options',
    code: `// Select all columns
const { data, error } = await client
  .from('users')
  .select('*')

// Select specific columns
const { data } = await client
  .from('users')
  .select('id, email, name')

// Select with ordering
const { data } = await client
  .from('users')
  .select('*')
  .order('created_at', { ascending: false })

// Select with pagination
const { data } = await client
  .from('users')
  .select('*')
  .range(0, 9)  // First 10 records`,
  },
  {
    title: 'Insert Data',
    description: 'Add new records to a table',
    code: `// Insert a single record
const { data, error } = await client
  .from('users')
  .insert({
    email: 'user@example.com',
    name: 'John Doe',
    status: 'active'
  })
  .select()

// Insert multiple records
const { data } = await client
  .from('users')
  .insert([
    { email: 'user1@example.com', name: 'User One' },
    { email: 'user2@example.com', name: 'User Two' },
    { email: 'user3@example.com', name: 'User Three' }
  ])
  .select()`,
  },
  {
    title: 'Update Data',
    description: 'Modify existing records in a table',
    code: `// Update a single record
const { data, error } = await client
  .from('users')
  .update({ status: 'inactive' })
  .eq('id', 1)
  .select()

// Update multiple records
const { data } = await client
  .from('users')
  .update({ verified: true })
  .eq('status', 'pending')
  .select()

// Update with conditional logic
const { data } = await client
  .from('users')
  .update({ last_login: new Date().toISOString() })
  .eq('email', 'user@example.com')
  .select()`,
  },
  {
    title: 'Delete Data',
    description: 'Remove records from a table',
    code: `// Delete a single record
const { error } = await client
  .from('users')
  .delete()
  .eq('id', 1)

// Delete multiple records
const { error } = await client
  .from('users')
  .delete()
  .in('id', [1, 2, 3])

// Delete with condition
const { error } = await client
  .from('users')
  .delete()
  .lt('created_at', '2024-01-01')`,
  },
  {
    title: 'Filter Operators',
    description: 'Use various filter operators to refine your queries',
    code: `// Equality filters
await client
  .from('users')
  .select('*')
  .eq('status', 'active')  // status = 'active'

// Not equal
await client
  .from('users')
  .select('*')
  .neq('status', 'inactive')  // status != 'inactive'

// Comparison operators
await client
  .from('products')
  .select('*')
  .gt('price', 100)  // price > 100

await client
  .from('products')
  .select('*')
  .gte('price', 100)  // price >= 100

await client
  .from('products')
  .select('*')
  .lt('price', 500)  // price < 500

await client
  .from('products')
  .select('*')
  .lte('price', 500)  // price <= 500

// String matching
await client
  .from('users')
  .select('*')
  .like('name', '%John%')  // name contains 'John'

await client
  .from('users')
  .select('*')
  .ilike('email', '%@example.com')  // case-insensitive

// Array operators
await client
  .from('posts')
  .select('*')
  .contains('tags', ['javascript', 'typescript'])

await client
  .from('posts')
  .select('*')
  .in('status', ['draft', 'published'])`,
  },
  {
    title: 'Combining Filters',
    description: 'Chain multiple filters together for complex queries',
    code: `// Multiple filters with AND logic
const { data } = await client
  .from('users')
  .select('*')
  .eq('status', 'active')
  .gte('age', 18)
  .order('created_at', { ascending: false })
  .limit(10)

// Filter with OR logic using 'or'
const { data } = await client
  .from('products')
  .select('*')
  .or('category.eq(electronics),price.gt(100)')

// Complex filtering
const { data } = await client
  .from('orders')
  .select('*')
  .eq('user_id', 1)
  .in('status', ['pending', 'processing'])
  .gte('total', 50)
  .order('created_at', { ascending: false })`,
  },
  {
    title: 'Joins and Relations',
    description: 'Query related data using foreign key relationships',
    code: `// Join with related table using foreign keys
const { data, error } = await client
  .from('orders')
  .select(\`
    id,
    total,
    created_at,
    user:users(
      id,
      email,
      name
    ),
    items:order_items(
      id,
      quantity,
      price,
      product:products(
        id,
        name,
        image_url
      )
    )
  \`)
  .eq('id', 1)

// Multiple joins
const { data } = await client
  .from('posts')
  .select(\`
    id,
    title,
    content,
    author:users(
      id,
      name,
      avatar_url
    ),
    comments(
      id,
      text,
      created_at,
      user:users(
        id,
        name
      )
    )
  \`)
  .order('created_at', { ascending: false })`,
  },
]

const authExamples = [
  {
    title: 'Sign Up (Registration)',
    description: 'Create a new user account with email and password',
    code: `// Basic sign up with email and password
const { data, error } = await client.auth.signUp({
  email: 'user@example.com',
  password: 'secure_password_123'
})

// Sign up with additional user metadata
const { data, error } = await client.auth.signUp({
  email: 'user@example.com',
  password: 'secure_password_123',
  name: 'John Doe',
  metadata: {
    company: 'Acme Corp',
    role: 'developer'
  }
})

// Check if sign up was successful
if (error) {
  console.error('Sign up failed:', error.message)
} else {
  console.log('User created:', data.user)
  console.log('Session:', data.session)
}`,
  },
  {
    title: 'Sign In (Login)',
    description: 'Authenticate an existing user with email and password',
    code: `// Basic sign in
const { data, error } = await client.auth.signIn({
  email: 'user@example.com',
  password: 'user_password_123'
})

// Sign in with session persistence
const { data, error } = await client.auth.signIn({
  email: 'user@example.com',
  password: 'user_password_123'
}, {
  // Persist session in localStorage (browser only)
  persistSession: true
})

// Handle sign in response
if (error) {
  console.error('Sign in failed:', error.message)
  // Common errors: invalid_credentials, user_not_found, email_not_confirmed
} else {
  console.log('Signed in successfully')
  console.log('User ID:', data.user.id)
  console.log('Access token:', data.session.access_token)
}`,
  },
  {
    title: 'Get Current User',
    description: 'Retrieve the currently authenticated user',
    code: `// Get current user (if session exists)
const { data: { user }, error } = await client.auth.getUser()

if (error) {
  console.error('Error fetching user:', error.message)
} else if (user) {
  console.log('Current user:', user)
  console.log('User ID:', user.id)
  console.log('User email:', user.email)
  console.log('User metadata:', user.metadata)
} else {
  console.log('No user is currently signed in')
}

// Check if user is authenticated
const isAuthenticated = !!user

// Access user properties
if (user) {
  const { id, email, name, metadata, created_at } = user
}`,
  },
  {
    title: 'Sign Out',
    description: 'Sign out the current user and clear the session',
    code: `// Basic sign out
const { error } = await client.auth.signOut()

if (error) {
  console.error('Sign out failed:', error.message)
} else {
  console.log('Signed out successfully')
}

// Sign out and redirect (common pattern)
const handleSignOut = async () => {
  const { error } = await client.auth.signOut()
  if (!error) {
    // Redirect to login page or home
    window.location.href = '/login'
  }
}

// Sign out from all devices (if your backend supports it)
const { error } = await client.auth.signOut({
  scope: 'global' // Signs out from all sessions
})`,
  },
  {
    title: 'Session Management',
    description: 'Manage user sessions and tokens',
    code: `// Listen to auth state changes (React example)
useEffect(() => {
  const { data: { subscription } } = client.auth.onAuthStateChange(
    (event, session) => {
      console.log('Auth event:', event)
      // Events: 'SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED', 'TOKEN_REFRESHED'
      console.log('Session:', session)

      switch (event) {
        case 'SIGNED_IN':
          console.log('User signed in')
          break
        case 'SIGNED_OUT':
          console.log('User signed out')
          break
        case 'TOKEN_REFRESHED':
          console.log('Token refreshed automatically')
          break
      }
    }
  )

  return () => subscription.unsubscribe()
}, [])

// Refresh session manually
const { data, error } = await client.auth.refreshSession()

// Get current session
const { data: { session } } = await client.auth.getSession()

// Check if session is valid
const isSessionValid = () => {
  const { data: { session } } = client.auth.getSession()
  return !!session && new Date(session.expires_at) > new Date()
}`,
  },
  {
    title: 'Update User Profile',
    description: 'Update the current user\'s information',
    code: `// Update user metadata
const { data, error } = await client.auth.updateUser({
  name: 'Jane Doe',
  metadata: {
    company: 'New Company',
    avatar_url: 'https://example.com/avatar.jpg'
  }
})

// Update user email (requires verification)
const { data, error } = await client.auth.updateUser({
  email: 'newemail@example.com'
})

// Update password
const { data, error } = await client.auth.updateUser({
  password: 'new_secure_password_123'
})

// Handle update response
if (error) {
  console.error('Update failed:', error.message)
} else {
  console.log('User updated:', data.user)
}`,
  },
  {
    title: 'Reset Password',
    description: 'Handle password reset flow',
    code: `// Request password reset (sends email to user)
const { data, error } = await client.auth.resetPasswordForEmail(
  'user@example.com'
)

if (error) {
  console.error('Reset request failed:', error.message)
} else {
  console.log('Password reset email sent')
}

// Update password with reset token (from email link)
const { data, error } = await client.auth.updateUser({
  password: 'new_password_123'
})

// Complete password reset flow
const handlePasswordReset = async (newPassword: string) => {
  const { data, error } = await client.auth.updateUser({
    password: newPassword
  })

  if (error) {
    console.error('Password reset failed:', error.message)
  } else {
    console.log('Password updated successfully')
    // Redirect to sign in page
    window.location.href = '/login'
  }
}`,
  },
  {
    title: 'Error Handling',
    description: 'Handle common authentication errors',
    code: `// Helper function to handle auth errors
const handleAuthError = (error: any) => {
  switch (error?.message) {
    case 'invalid_credentials':
      return 'Invalid email or password'
    case 'user_not_found':
      return 'No account found with this email'
    case 'email_not_confirmed':
      return 'Please verify your email before signing in'
    case 'weak_password':
      return 'Password must be at least 8 characters'
    case 'email_already_exists':
      return 'An account with this email already exists'
    case 'session_expired':
      return 'Your session has expired, please sign in again'
    default:
      return 'An unexpected error occurred'
  }
}

// Usage example
const { data, error } = await client.auth.signIn({
  email: 'user@example.com',
  password: 'password'
})

if (error) {
  const userMessage = handleAuthError(error)
  console.error(userMessage)
  // Show error to user in UI
}`,
  },
]

const errorHandlingExamples = [
  {
    title: 'Basic Try/Catch Pattern',
    description: 'Handle errors with try/catch blocks for async operations',
    code: `// Basic error handling pattern
try {
  const { data, error } = await client
    .from('users')
    .select('*')
    .eq('id', userId)

  if (error) {
    console.error('Query failed:', error.message)
    // Handle the error appropriately
    return
  }

  // Success - use the data
  console.log('User data:', data)
} catch (err) {
  // Handle unexpected errors (network issues, etc.)
  console.error('Unexpected error:', err)
}

// Always check for errors before using data
const { data, error } = await client
  .from('posts')
  .insert({ title: 'New Post', content: 'Content here' })

if (error) {
  // Log error and show user-friendly message
  console.error('Insert failed:', error)
  alert('Failed to create post. Please try again.')
  return
}

// Continue only if no error
console.log('Post created:', data)`,
  },
  {
    title: 'Error Object Structure',
    description: 'Understand the error object returned by the SDK',
    code: `// Error object structure
const { data, error } = await client
  .from('users')
  .select('*')

if (error) {
  console.log('Error message:', error.message)
  console.log('Error code:', error.code)      // e.g., '23505', 'PGRST116'
  console.log('Error details:', error.details)
  console.log('Error hint:', error.hint)
  console.log('Full error object:', error)

  // Example error output:
  // {
  //   message: "duplicate key value violates unique constraint",
  //   code: "23505",
  //   details: "Key (email)=(user@example.com) already exists.",
  //   hint: null
  // }
}

// Check for specific error codes
if (error?.code === '23505') {
  console.log('Duplicate key error - record already exists')
} else if (error?.code === 'PGRST116') {
  console.log('Not found error - resource does not exist')
}`,
  },
  {
    title: 'Common Error Codes',
    description: 'Handle specific error codes with custom messages',
    code: `// Helper function to handle common database errors
const handleDatabaseError = (error: any) => {
  if (!error) return null

  switch (error.code) {
    case '23505':
      return {
        message: 'This record already exists',
        type: 'duplicate',
        recoverable: false
      }

    case '23503':
      return {
        message: 'Referenced record does not exist',
        type: 'foreign_key_violation',
        recoverable: true
      }

    case '23502':
      return {
        message: 'Required field is missing',
        type: 'not_null_violation',
        recoverable: true
      }

    case 'PGRST116':
      return {
        message: 'Resource not found',
        type: 'not_found',
        recoverable: false
      }

    case '22P02':
      return {
        message: 'Invalid data format',
        type: 'invalid_text_representation',
        recoverable: true
      }

    default:
      return {
        message: error.message || 'An unexpected error occurred',
        type: 'unknown',
        recoverable: false
      }
  }
}

// Usage example
const { data, error } = await client
  .from('users')
  .insert({ email: 'user@example.com', name: 'John' })

if (error) {
  const handled = handleDatabaseError(error)
  console.log(handled.message)

  if (handled.recoverable) {
    // Allow user to fix and retry
    showFormWithErrorMessage(handled.message)
  } else {
    // Show error and prevent retry
    showFatalError(handled.message)
  }
}`,
  },
  {
    title: 'Network Error Handling',
    description: 'Handle network-related errors gracefully',
    code: `// Detect and handle network errors
const isNetworkError = (error: any) => {
  return error?.message?.includes('fetch') ||
         error?.message?.includes('network') ||
         error?.message?.includes('ECONNREFUSED') ||
         !error?.code // No error code usually means network issue
}

// Request with network error handling
const fetchWithRetry = async (
  operation: () => Promise<any>,
  maxRetries = 3
) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { data, error } = await operation()

      if (error) {
        if (isNetworkError(error) && attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000
          console.log(\`Network error, retrying in \${delay}ms...\`)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
        throw error
      }

      return data
    } catch (err: any) {
      if (attempt === maxRetries) {
        console.error('Max retries reached:', err)
        throw err
      }
    }
  }
}

// Usage
try {
  const data = await fetchWithRetry(() =>
    client.from('users').select('*')
  )
  console.log('Data fetched:', data)
} catch (error) {
  console.error('Failed after retries:', error)
  showNetworkErrorMessage()
}`,
  },
  {
    title: 'Retry Logic with Exponential Backoff',
    description: 'Implement automatic retries for transient failures',
    code: `// Generic retry wrapper with exponential backoff
const retryOperation = async <T>(
  operation: () => Promise<{ data?: T, error?: any }>,
  options: {
    maxRetries?: number
    baseDelay?: number
    maxDelay?: number
    retryableCodes?: string[]
  } = {}
): Promise<T> => {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    retryableCodes = ['PGRST116', '408', '503']
  } = options

  let lastError: any

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const { data, error } = await operation()

      if (error) {
        // Check if error is retryable
        const isRetryable = retryableCodes.includes(error.code) ||
                          isNetworkError(error)

        if (isRetryable && attempt < maxRetries) {
          lastError = error
          // Calculate delay with exponential backoff
          const delay = Math.min(
            baseDelay * Math.pow(2, attempt),
            maxDelay
          )
          console.log(\`Attempt \${attempt + 1} failed, retrying in \${delay}ms...\`)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }

        throw error
      }

      return data as T
    } catch (error: any) {
      if (attempt === maxRetries) {
        throw error
      }
      lastError = error
    }
  }

  throw lastError
}

// Usage examples
try {
  // Retry on network errors
  const users = await retryOperation(() =>
    client.from('users').select('*')
  )

  // Retry with custom options
  const posts = await retryOperation(() =>
    client.from('posts').insert({ title: 'Post' })
  , {
    maxRetries: 5,
    baseDelay: 2000,
    retryableCodes: ['23505'] // Retry on duplicate key
  })
} catch (error) {
  console.error('Operation failed after all retries:', error)
}`,
  },
  {
    title: 'Error Boundaries (React)',
    description: 'Use React Error Boundaries to catch errors in components',
    code: `// Error Boundary Component
import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

class SDKErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('SDK Error caught by boundary:', error)
    console.error('Error info:', errorInfo)

    // Log to error tracking service
    // logErrorToService(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// Usage in your app
function App() {
  return (
    <SDKErrorBoundary>
      <MyComponentUsingSDK />
    </SDKErrorBoundary>
  )
}

// Functional alternative with hooks
const useSDKErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null)

  const execute = async <T>(
    operation: () => Promise<{ data?: T, error?: any }>
  ): Promise<T | null> => {
    try {
      const { data, error } = await operation()

      if (error) {
        throw new Error(error.message)
      }

      return data as T
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error(err.message)
      setError(error)
      return null
    }
  }

  const clear = () => setError(null)

  return { error, execute, clear }
}

// Usage in component
function UserProfile({ userId }: { userId: string }) {
  const { error, execute, clear } = useSDKErrorHandler()

  const loadUser = async () => {
    const user = await execute(() =>
      client.from('users').select('*').eq('id', userId).single()
    )

    if (user) {
      console.log('User loaded:', user)
    }
  }

  if (error) {
    return <div>Error: {error.message}</div>
  }

  return <button onClick={loadUser}>Load User</button>
}`,
  },
  {
    title: 'Validation Errors',
    description: 'Handle validation and constraint errors',
    code: `// Type-safe data validation
interface CreateUserInput {
  email: string
  name: string
  age?: number
}

const validateUserInput = (input: CreateUserInput): string[] => {
  const errors: string[] = []

  // Email validation
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/
  if (!input.email) {
    errors.push('Email is required')
  } else if (!emailRegex.test(input.email)) {
    errors.push('Email format is invalid')
  }

  // Name validation
  if (!input.name || input.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters')
  }

  // Age validation
  if (input.age !== undefined) {
    if (input.age < 0 || input.age > 150) {
      errors.push('Age must be between 0 and 150')
    }
  }

  return errors
}

// Usage with SDK
const createUser = async (input: CreateUserInput) => {
  // Validate first
  const validationErrors = validateUserInput(input)
  if (validationErrors.length > 0) {
    console.error('Validation errors:', validationErrors)
    return { error: { message: validationErrors.join(', ') } }
  }

  // Proceed with SDK call
  const { data, error } = await client
    .from('users')
    .insert(input)
    .select()

  if (error) {
    // Handle database constraint errors
    if (error.code === '23505') {
      return { error: { message: 'Email already registered' } }
    }
    return { error }
  }

  return { data }
}`,
  },
  {
    title: 'Error Logging and Monitoring',
    description: 'Log errors for debugging and monitoring',
    code: `// Error logging utility
const logSDKError = (
  operation: string,
  error: any,
  context?: Record<string, any>
) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    operation,
    error: {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint
    },
    context,
    environment: process.env.NODE_ENV,
    userAgent: navigator?.userAgent
  }

  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.error('[SDK Error]', errorLog)
  }

  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Send to Sentry, DataDog, etc.
    // monitoringService.captureError(errorLog)
  }
}

// Usage with SDK operations
const safeSDKOperation = async <T>(
  operationName: string,
  operation: () => Promise<{ data?: T, error?: any }>,
  context?: Record<string, any>
): Promise<T | null> => {
  try {
    const { data, error } = await operation()

    if (error) {
      logSDKError(operationName, error, context)
      return null
    }

    return data as T
  } catch (err: any) {
    logSDKError(operationName, err, context)
    return null
  }
}

// Examples
const user = await safeSDKOperation(
  'fetch_user_by_id',
  () => client.from('users').select('*').eq('id', userId).single(),
  { userId }
)

const post = await safeSDKOperation(
  'create_post',
  () => client.from('posts').insert({ title, content }).select(),
  { title, content, userId: session.user.id }
)`,
  },
]

const realtimeExamples = [
  {
    title: 'Subscribe to All Changes',
    description: 'Listen to all INSERT, UPDATE, and DELETE events on a table',
    code: `// Subscribe to all changes on the users table
const channel = client.realtime
  .channel('users-all-changes')
  .on(
    'postgres_changes',
    {
      event: '*',  // Listen to all events: INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'users'
    },
    (payload) => {
      console.log('Change detected:', payload)
      // payload contains: { eventType, new, old, errors }
      switch (payload.eventType) {
        case 'INSERT':
          console.log('New user:', payload.new)
          break
        case 'UPDATE':
          console.log('Updated user:', payload.new)
          console.log('Previous values:', payload.old)
          break
        case 'DELETE':
          console.log('Deleted user:', payload.old)
          break
      }
    }
  )
  .subscribe((status) => {
    console.log('Subscription status:', status)
    // Status values: 'SUBSCRIBED', 'TIMED_OUT', 'CLOSED', 'CHANNEL_ERROR'
  })

// Unsubscribe when done (important for cleanup)
channel.unsubscribe()`,
  },
  {
    title: 'Subscribe to Specific Events',
    description: 'Listen to only INSERT, UPDATE, or DELETE events',
    code: `// Subscribe only to new records (INSERT)
const insertChannel = client.realtime
  .channel('new-users')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'users'
    },
    (payload) => {
      console.log('New user created:', payload.new)
      // Show notification, update UI, etc.
    }
  )
  .subscribe()

// Subscribe only to updates (UPDATE)
const updateChannel = client.realtime
  .channel('user-updates')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'users'
    },
    (payload) => {
      console.log('User updated:', payload.new)
      // Compare payload.new with payload.old to see what changed
    }
  )
  .subscribe()

// Subscribe only to deletions (DELETE)
const deleteChannel = client.realtime
  .channel('user-deletions')
  .on(
    'postgres_changes',
    {
      event: 'DELETE',
      schema: 'public',
      table: 'users'
    },
    (payload) => {
      console.log('User deleted:', payload.old)
      // Remove from UI, show notification, etc.
    }
  )
  .subscribe()`,
  },
  {
    title: 'Filter Subscriptions',
    description: 'Subscribe to changes that match specific criteria',
    code: `// Subscribe to changes where status equals 'active'
const activeUsersChannel = client.realtime
  .channel('active-users')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'users',
      filter: 'status=eq.active'  // Only users where status = 'active'
    },
    (payload) => {
      console.log('Active user changed:', payload)
    }
  )
  .subscribe()

// Subscribe to changes for a specific user ID
const userChannel = client.realtime
  .channel('user-123')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'users',
      filter: 'id=eq.123'  // Only user with ID 123
    },
    (payload) => {
      console.log('User 123 changed:', payload)
    }
  )
  .subscribe()

// Multiple filter examples
const filterChannel = client.realtime
  .channel('filtered-updates')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'products',
      filter: 'category=eq.electronics'  // Only electronics
    },
    (payload) => {
      console.log('Electronics product changed:', payload)
    }
  )
  .subscribe()`,
  },
  {
    title: 'Multiple Subscriptions',
    description: 'Listen to multiple tables or events on a single channel',
    code: `// Subscribe to multiple tables on one channel
const multiChannel = client.realtime
  .channel('app-updates')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'users'
    },
    (payload) => {
      console.log('New user:', payload.new)
    }
  )
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'posts'
    },
    (payload) => {
      console.log('New post:', payload.new)
    }
  )
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'notifications'
    },
    (payload) => {
      console.log('Notification:', payload)
    }
  )
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('All subscriptions active')
    }
  })

// Unsubscribe from all at once
multiChannel.unsubscribe()`,
  },
  {
    title: 'Channel with Presence Tracking',
    description: 'Track online users and their state in real-time',
    code: `// Enable presence tracking for collaborative features
const presenceChannel = client.realtime
  .channel('online-users', { config: { presence: { key: 'user123' } } })
  .on('presence', { event: 'sync' }, () => {
    const presenceState = presenceChannel.presenceState()
    console.log('Online users:', presenceState)
    // Returns: { user123: { online_at: '...' }, user456: { online_at: '...' } }
  })
  .on('presence', { event: 'join' }, ({ key, newPresences }) => {
    console.log('User joined:', key, newPresences)
    // Show user came online
  })
  .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
    console.log('User left:', key, leftPresences)
    // Show user went offline
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      // Track your own presence state
      await presenceChannel.track({
        online_at: new Date().toISOString(),
        user: { id: 'user123', name: 'John Doe' }
      })
    }
  })

// Update presence state
await presenceChannel.track({
  online_at: new Date().toISOString(),
  user: { id: 'user123', name: 'John Doe' },
  status: 'typing'  // Custom state
})`,
  },
  {
    title: 'Broadcast Messages',
    description: 'Send and receive custom messages between clients',
    code: `// Create a channel for broadcast communication
const chatChannel = client.realtime
  .channel('chat-room')

// Listen for broadcast messages
chatChannel
  .on('broadcast', { event: 'message' }, ({ payload }) => {
    console.log('Received message:', payload)
    // payload contains your custom data structure
    displayMessage(payload)
  })
  .subscribe((status) => {
    console.log('Chat status:', status)
  })

// Send a broadcast message to all subscribers
await chatChannel.send({
  type: 'broadcast',
  event: 'message',
  payload: {
    from: 'user123',
    text: 'Hello everyone!',
    timestamp: new Date().toISOString()
  }
})

// Example: Send typing indicator
await chatChannel.send({
  type: 'broadcast',
  event: 'typing',
  payload: {
    userId: 'user123',
    isTyping: true
  }
})

// Clean up
chatChannel.unsubscribe()`,
  },
  {
    title: 'Unsubscribe and Cleanup',
    description: 'Properly manage subscription lifecycle',
    code: `// In a React component, use useEffect for cleanup
useEffect(() => {
  const channel = client.realtime
    .channel('my-subscription')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tasks'
      },
      (payload) => {
        // Update component state with new data
        setTasks(prev => {
          if (payload.eventType === 'INSERT') {
            return [...prev, payload.new]
          } else if (payload.eventType === 'UPDATE') {
            return prev.map(t => t.id === payload.new.id ? payload.new : t)
          } else if (payload.eventType === 'DELETE') {
            return prev.filter(t => t.id !== payload.old.id)
          }
          return prev
        })
      }
    )
    .subscribe()

  // Cleanup function - unsubscribe when component unmounts
  return () => {
    channel.unsubscribe()
  }
}, [])

// Manual unsubscribe
const channel = client.realtime.channel('temp-channel')
channel.subscribe()

// Later, when done:
channel.unsubscribe()

// Unsubscribe all channels (e.g., on logout)
client.realtime.channels.forEach(channel => {
  channel.unsubscribe()
})`,
  },
  {
    title: 'Error Handling and Reconnection',
    description: 'Handle connection issues and automatic reconnection',
    code: `// Subscribe with connection state monitoring
const channel = client.realtime
  .channel('reliable-channel')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'data'
    },
    (payload) => {
      console.log('Data changed:', payload)
    }
  )
  .subscribe((status, err) => {
    console.log('Subscription status:', status)

    switch (status) {
      case 'SUBSCRIBED':
        console.log('Successfully connected and listening')
        break
      case 'TIMED_OUT':
        console.log('Connection timed out, retrying...')
        // SDK will automatically retry
        break
      case 'CLOSED':
        console.log('Connection closed')
        break
      case 'CHANNEL_ERROR':
        console.error('Channel error:', err)
        // Handle error, show message to user
        break
    }
  })

// Check subscription health
const getState = () => {
  const state = channel.state
  console.log('Channel state:', state)
  // Returns: 'joined', 'joining', 'leaving', 'closed'
}

// Close channel explicitly
const cleanup = () => {
  channel.unsubscribe()
  console.log('Channel cleaned up')
}`,
  },
]

const typescriptExamples = [
  {
    title: 'Type Definitions',
    description: 'Define TypeScript interfaces for your database schema',
    code: `// Define your database table types
interface User {
  id: string
  email: string
  name: string
  status: 'active' | 'inactive' | 'pending'
  created_at: string
  updated_at?: string
}

interface Post {
  id: string
  title: string
  content: string
  user_id: string
  published: boolean
  created_at: string
}

// Define relationship types
interface PostWithUser extends Post {
  user: User
}

interface UserWithPosts extends User {
  posts: Post[]
}

// Define response types
type DatabaseResponse<T> = {
  data: T[] | null
  error: {
    message: string
    code: string
    details?: string
    hint?: string
  } | null
}

type SingleResponse<T> = {
  data: T | null
  error: {
    message: string
    code: string
  } | null
}`,
  },
  {
    title: 'Generic Query Function',
    description: 'Create reusable type-safe query functions',
    code: `// Generic function to fetch a single record
async function fetchOne<T>(
  table: string,
  filters: Record<string, any>
): Promise<T | null> {
  const { data, error } = await client
    .from(table)
    .select('*')
    .match(filters)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as T
}

// Generic function to fetch multiple records
async function fetchMany<T>(
  table: string,
  options?: {
    filters?: Record<string, any>
    orderBy?: { column: string; ascending?: boolean }
    limit?: number
  }
): Promise<T[]> {
  let query = client.from(table).select('*')

  if (options?.filters) {
    query = query.match(filters)
  }

  if (options?.orderBy) {
    query = query.order(options.orderBy.column, {
      ascending: options.orderBy.ascending ?? true
    })
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as T[]
}

// Usage examples
const user = await fetchOne<User>('users', { id: '123' })
const activeUsers = await fetchMany<User>('users', {
  filters: { status: 'active' },
  orderBy: { column: 'created_at', ascending: false },
  limit: 10
})`,
  },
  {
    title: 'Type-Safe Insert',
    description: 'Ensure data types match your schema when inserting',
    code: `// Create type-safe insert functions
async function createUser(
  userData: Omit<User, 'id' | 'created_at'>
): Promise<User> {
  const { data, error } = await client
    .from('users')
    .insert(userData)
    .select()
    .single()

  if (error) {
    throw new Error(\`Failed to create user: \${error.message}\`)
  }

  return data as User
}

// Create type-safe batch insert
async function createPosts(
  posts: Omit<Post, 'id' | 'created_at'>[]
): Promise<Post[]> {
  const { data, error } = await client
    .from('posts')
    .insert(posts)
    .select()

  if (error) {
    throw new Error(\`Failed to create posts: \${error.message}\`)
  }

  return (data ?? []) as Post[]
}

// Usage with full type safety
const newUser = await createUser({
  email: 'user@example.com',
  name: 'John Doe',
  status: 'active'  // TypeScript enforces valid values
})

const newPosts = await createPosts([
  {
    title: 'First Post',
    content: 'Content here',
    user_id: newUser.id,
    published: false
  },
  {
    title: 'Second Post',
    content: 'More content',
    user_id: newUser.id,
    published: true
  }
])`,
  },
  {
    title: 'Type-Safe Updates',
    description: 'Update records with partial type safety',
    code: `// Create type-safe update functions
type UpdateableUserFields = Partial<
  Pick<User, 'email' | 'name' | 'status'>
>

async function updateUser(
  userId: string,
  updates: UpdateableUserFields
): Promise<User> {
  const { data, error } = await client
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    throw new Error(\`Failed to update user: \${error.message}\`)
  }

  return data as User
}

// Conditional update utility
async function updateUserIf<T extends Record<string, any>>(
  table: string,
  userId: string,
  condition: keyof T,
  updates: Partial<T>
): Promise<boolean> {
  const { data, error } = await client
    .from(table)
    .update(updates)
    .eq('id', userId)
    .eq(condition as string, true)
    .select()

  if (error) {
    throw new Error(\`Failed conditional update: \${error.message}\`)
  }

  return (data?.length ?? 0) > 0
}

// Usage
await updateUser('123', {
  status: 'inactive'  // TypeScript validates field types
})

const wasUpdated = await updateUserIf<User>(
  'users',
  '123',
  'status',
  { status: 'inactive' }
)`,
  },
  {
    title: 'Typed Join Queries',
    description: 'Get type-safe results from table joins',
    code: `// Define typed join result types
interface OrderWithItems {
  id: string
  total: number
  created_at: string
  user: {
    id: string
    email: string
    name: string
  }
  items: {
    id: string
    quantity: number
    price: number
    product: {
      id: string
      name: string
      image_url: string
    }
  }[]
}

// Type-safe join query function
async function getOrderWithItems(
  orderId: string
): Promise<OrderWithItems> {
  const { data, error } = await client
    .from('orders')
    .select(\`
      id,
      total,
      created_at,
      user:users!inner(
        id,
        email,
        name
      ),
      items:order_items(
        id,
        quantity,
        price,
        product:products(
          id,
          name,
          image_url
        )
      )
    \`)
    .eq('id', orderId)
    .single()

  if (error) {
    throw new Error(\`Failed to fetch order: \${error.message}\`)
  }

  return data as OrderWithItems
}

// Generic join utility
async function fetchWithRelation<
  T extends Record<string, any>,
  R extends Record<string, any>
>(
  table: string,
  relation: string,
  columns: string,
  filters?: Record<string, any>
): Promise<Array<T & { [K in string]: R }>> {
  let query = client
    .from(table)
    .select(\`*, \${relation}(\${columns})\`)

  if (filters) {
    query = query.match(filters)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as Array<T & { [K in string]: R }>
}`,
  },
  {
    title: 'React Hook with TypeScript',
    description: 'Type-safe custom hooks for data fetching',
    code: `import { useState, useEffect } from 'react'

// Generic useQuery hook
function useQuery<T>(
  table: string,
  filters?: Record<string, any>
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)

      try {
        let query = client.from(table).select('*')

        if (filters) {
          query = query.match(filters)
        }

        const { data, error } = await query

        if (error) {
          setError(error.message)
        } else {
          setData((data ?? []) as T[])
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [table, JSON.stringify(filters)])

  return { data, loading, error }
}

// Type-safe mutation hook
function useMutation<T, R = T>() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = async (
    operation: () => Promise<{ data?: R; error?: any }>
  ): Promise<R | null> => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await operation()

      if (error) {
        setError(error.message)
        return null
      }

      return data as R
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  return { mutate, loading, error }
}

// Usage in component
function UserProfile({ userId }: { userId: string }) {
  const { data: user, loading, error } = useQuery<User>('users', { id: userId })
  const { mutate: updateUser, loading: updating } = useMutation<User>()

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <h1>{user[0]?.name}</h1>
      <p>{user[0]?.email}</p>
    </div>
  )
}`,
  },
]

const codeExamples = [
  {
    title: 'Import and Initialize',
    description: 'Create a client instance with your API credentials',
    code: `import { createClient } from 'nextmavens-js'

const client = createClient({
  apiKey: process.env.NEXTMAVENS_API_KEY,
  projectId: 'your-project-id'
})`,
  },
  {
    title: 'File Storage',
    description: 'Upload and manage files',
    code: `// Upload a file
const { data, error } = await client.storage
  .from('avatars')
  .upload('user123.jpg', file)

// Get a public URL
const { data } = client.storage
  .from('avatars')
  .getPublicUrl('user123.jpg')

// List files
const { data } = await client.storage
  .from('avatars')
  .list()

// Delete a file
await client.storage
  .from('avatars')
  .remove(['user123.jpg'])`,
  },
  {
    title: 'GraphQL Queries',
    description: 'Execute GraphQL queries',
    code: `// Execute a GraphQL query
const { data, error } = await client.graphql(\`
  query GetUsers(\$limit: Int!) {
    users(limit: \$limit) {
      id
      email
      name
      created_at
    }
  }
\`, { variables: { limit: 10 } })`,
  },
]

export default function SDKDocsPage() {
  const [copied, setCopied] = useState<string | null>(null)

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="min-h-screen bg-[#F3F5F7]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        :root { --font-sans: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif; }
        .font-jakarta { font-family: var(--font-sans); }
      `}</style>

      <nav className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-[1180px] px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-700 text-white shadow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 12c5 0 4-8 10-8 0 3 6 3 6 8s-6 5-6 8c-6 0-5-8-10-8Z" fill="currentColor" />
              </svg>
            </div>
            <span className="font-jakarta text-xl font-semibold tracking-tight text-slate-900">nextmavens</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">Home</Link>
            <Link href="/docs" className="text-sm text-slate-900 font-medium">Docs</Link>
            <Link href="/mcp" className="text-sm text-slate-600 hover:text-slate-900">MCP</Link>
            <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900">Login</Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-[1180px] px-4 py-12">
        <Link href="/docs" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Docs
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Code2 className="w-6 h-6 text-blue-700" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">JavaScript SDK</h1>
            <p className="text-slate-600">Official JavaScript/TypeScript client for NextMavens</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Overview</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            The NextMavens JavaScript SDK provides a comprehensive interface to all NextMavens services from your JavaScript or TypeScript application.
            It handles authentication, database queries, file storage, realtime subscriptions, and GraphQL operations with a simple and intuitive API.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-medium text-slate-900 mb-2">TypeScript Support</h3>
              <p className="text-sm text-slate-600">Full TypeScript definitions included for type-safe development.</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-medium text-slate-900 mb-2">Tree Shakable</h3>
              <p className="text-sm text-slate-600">Modern ES modules with tree shaking for optimal bundle size.</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-medium text-slate-900 mb-2">Framework Agnostic</h3>
              <p className="text-sm text-slate-600">Works with React, Vue, Angular, Node.js, and any JS environment.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Installation</h2>
          <p className="text-slate-600 mb-6">Install the SDK using your preferred package manager:</p>
          <div className="grid md:grid-cols-3 gap-4">
            {installMethods.map((method) => (
              <div key={method.name} className="relative group">
                <button
                  onClick={() => handleCopy(method.command, `install-${method.name}`)}
                  className="absolute top-3 right-3 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg opacity-0 group-hover:opacity-100 transition"
                >
                  {copied === `install-${method.name}` ? (
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <p className="text-xs text-slate-500 mb-2 font-medium">{method.name}</p>
                  <code className="text-sm text-slate-900">{method.command}</code>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Client Configuration Section */}
        <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Client Configuration</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-3">Required Options</h3>
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-3">
                  <code className="text-sm text-emerald-700 bg-emerald-50 px-2 py-1 rounded font-mono">apiKey</code>
                  <div>
                    <p className="text-sm font-medium text-slate-900">API Key (string, required)</p>
                    <p className="text-xs text-slate-600">Your NextMavens API key from theühl dashboard</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <code className="text-sm text-emerald-700 bg-emerald-50 px-2 py-1 rounded font-mono">projectId</code>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Project ID (string, required)</p>
                    <p className="text-xs text-slate-600">Your project ID found in project settings</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-3">Optional Options</h3>
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-3">
                  <code className="text-sm text-blue-700 bg-blue-50 px-2 py-1 rounded font-mono">apiUrl</code>
                  <div>
                    <p className="text-sm text-slate-700">Override default API URL</p>
                    <p className="text-xs text-slate-500">Default: https://api.nextmavens.cloud</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <code className="text-sm text-blue-700 bg-blue-50 px-2 py-1 rounded font-mono">timeout</code>
                  <div>
                    <p className="text-sm text-slate-700">Request timeout in milliseconds</p>
                    <p className="text-xs text-slate-500">Default: 30000 (30 seconds)</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-3">Environment Variables</h3>
              <p className="text-sm text-slate-600 mb-4">Store your API key in a <code className="bg-slate-100 px-2 py-1 rounded">.env</code> file:</p>
              <div className="relative group">
                <button
                  onClick={() => handleCopy(`NEXTMAVENS_API_KEY=your_api_key_here
NEXTMAVENS_PROJECT_ID=your_project_id`, 'env-file')}
                  className="absolute top-3 right-3 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg opacity-0 group-hover:opacity-100 transition z-10"
                >
                  {copied === 'env-file' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                </button>
                <div className="bg-slate-900 rounded-lg p-4">
                  <code className="text-sm text-slate-300 font-mono block">{`NEXTMAVENS_API_KEY=your_api_key_here
NEXTMAVENS_PROJECT_ID=your_project_id`}</code>
                </div>
              </div临>
            </div>

            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-3">Different Environments</h3>
              <p className="text-sm text-slate-600 mb-4">Configure different API URLs for development/staging/production:</p>
              <div className="relative group">
                <button
                  onClick={() => handleCopy(`const client = createClient({
  apiKey: process.env.NEXTMA技术服务-MAVENS_API_KEY!,
  projectId: process.env.NEXTMAVENS_PROJECT_ID!,
  apiUrl: process.env.NODE_ENV === 'development'
    ? 'https://dev-api.nextmavens.cloud'
    : 'https://api.nextmavens.cloud'
})`, 'env-config')}
                  className="absolute top-3 right-3 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg opacity-0 group-hover:opacity-100 transition z-10"
                >
                  {copied === 'env-config' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                </button>
                <pre className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                  <code className="text-sm text-slate-300 font-mono">{`const client = createClient({
  apiKey: process.env.NEXTMAVENS_API_KEY!,
  projectId: process.env.NEXTMAVENS_PROJECT_ID!,
  apiUrl: process.env.NODE_ENV === 'development'
    ? 'https://dev-api.nextmavens.cloud'
    : 'https://api.nextmavens.cloud'
})`}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Database Section */}
        <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <svg className="w-5 h-5 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Database</h2>
              <p className="text-slate-600">Query and manipulate your PostgreSQL database</p>
            </div>
          </div>

          <div className="space-y-6">
            {databaseExamples.map((example, index) => (
              <motion.div
                key={example.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border border-slate-200 rounded-lg overflow-hidden"
              >
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                  <h3 className="text-base font-semibold text-slate-900 mb-1">{example.title}</h3>
                  <p className="text-sm text-slate-600">{example.description}</p>
                </div>
                <div className="p-4">
                  <div className="relative group">
                    <button
                      onClick={() => handleCopy(example.code, `db-${index}`)}
                      className="absolute top-2 right-2 p-1.5 bg-slate-700 hover:bg-slate-600 rounded opacity-0 group-hover:opacity-100 transition z-10"
                      aria-label="Copy code"
                    >
                      {copied === `db-${index}` ? (
                        <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                    <pre className="bg-slate-900 rounded p-3 overflow-x-auto">
                      <code className="text-xs text-slate-300 font-mono block">{example.code}</code>
                    </pre>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Key Concepts</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• All queries return a <code className="bg-blue-100 px-1 rounded">{ data, error }</code> object</li>
              <li>• Use <code className="bg-blue-100 px-1 rounded">.select()</code> to specify which columns to retrieve</li>
              <li>• Chain filters like <code className="bg-blue-100 px-1 rounded">.eq()</code>, <code className="bg-blue-100 px-1 rounded">.gt()</code>, <code className="bg-blue-100 px-1 rounded">.in()</code> to refine queries</li>
              <li>• Use <code className="bg-blue-100 px-1 rounded">.order()</code> for sorting and <code className="bg-blue-100 px-1 rounded">.limit()</code> / <code className="bg-blue-100 px-1 rounded">.range()</code> for pagination</li>
              <li>• Join related tables by nesting column selections with the table name</li>
            </ul>
          </div>
        </div>

        {/* Authentication Section */}
        <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-5 h-5 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Authentication</h2>
              <p className="text-slate-600">Handle user authentication and session management</p>
            </div>
          </div>

          <div className="space-y-6">
            {authExamples.map((example, index) => (
              <motion.div
                key={example.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border border-slate-200 rounded-lg overflow-hidden"
              >
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                  <h3 className="text-base font-semibold text-slate-900 mb-1">{example.title}</h3>
                  <p className="text-sm text-slate-600">{example.description}</p>
                </div>
                <div className="p-4">
                  <div className="relative group">
                    <button
                      onClick={() => handleCopy(example.code, `auth-${index}`)}
                      className="absolute top-2 right-2 p-1.5 bg-slate-700 hover:bg-slate-600 rounded opacity-0 group-hover:opacity-100 transition z-10"
                      aria-label="Copy code"
                    >
                      {copied === `auth-${index}` ? (
                        <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                    <pre className="bg-slate-900 rounded p-3 overflow-x-auto">
                      <code className="text-xs text-slate-300 font-mono block">{example.code}</code>
                    </pre>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h4 className="text-sm font-semibold text-purple-900 mb-2">Authentication Best Practices</h4>
            <ul className="text-xs text-purple-800 space-y-1">
              <li>• Always handle errors and display user-friendly messages</li>
              <li>• Store tokens securely (the SDK handles this automatically with localStorage)</li>
              <li>• Implement proper session management with auth state listeners</li>
              <li>• Use strong password requirements for sign up</li>
              <li>• Implement email verification for new accounts</li>
              <li>• Use HTTPS in production to protect tokens in transit</li>
            </ul>
          </div>
        </div>

        {/* Error Handling Section */}
        <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-5 h-5 text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Error Handling</h2>
              <p className="text-slate-600">Handle errors gracefully with proper patterns and practices</p>
            </div>
          </div>

          <div className="space-y-6">
            {errorHandlingExamples.map((example, index) => (
              <motion.div
                key={example.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border border-slate-200 rounded-lg overflow-hidden"
              >
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                  <h3 className="text-base font-semibold text-slate-900 mb-1">{example.title}</h3>
                  <p className="text-sm text-slate-600">{example.description}</p>
                </div>
                <div className="p-4">
                  <div className="relative group">
                    <button
                      onClick={() => handleCopy(example.code, `error-${index}`)}
                      className="absolute top-2 right-2 p-1.5 bg-slate-700 hover:bg-slate-600 rounded opacity-0 group-hover:opacity-100 transition z-10"
                      aria-label="Copy code"
                    >
                      {copied === `error-${index}` ? (
                        <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                    <pre className="bg-slate-900 rounded p-3 overflow-x-auto">
                      <code className="text-xs text-slate-300 font-mono block">{example.code}</code>
                    </pre>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
            <h4 className="text-sm font-semibold text-red-900 mb-2">Error Handling Best Practices</h4>
            <ul className="text-xs text-red-800 space-y-1">
              <li>• Always check the error property before using data from SDK responses</li>
              <li>• Use try/catch blocks to handle unexpected errors and network issues</li>
              <li>• Implement retry logic with exponential backoff for transient failures</li>
              <li>• Validate user input on the client before sending to the server</li>
              <li>• Log errors in production for debugging and monitoring</li>
              <li>• Use React Error Boundaries to catch errors in component trees</li>
              <li>• Provide user-friendly error messages based on error codes</li>
              <li>• Distinguish between recoverable and fatal errors</li>
              <li>• Never expose sensitive information in error messages to users</li>
              <li>• Test error scenarios to ensure your app handles failures gracefully</li>
            </ul>
          </div>

          <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Common Error Codes Reference</h4>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="bg-white rounded p-3 border border-slate-200">
                <code className="text-xs text-emerald-700 font-mono">23505</code>
                <p className="text-xs text-slate-600 mt-1">Duplicate key violation - unique constraint failed</p>
              </div>
              <div className="bg-white rounded p-3 border border-slate-200">
                <code className="text-xs text-emerald-700 font-mono">23503</code>
                <p className="text-xs text-slate-600 mt-1">Foreign key violation - referenced record doesn't exist</p>
              </div>
              <div className="bg-white rounded p-3 border border-slate-200">
                <code className="text-xs text-emerald-700 font-mono">23502</code>
                <p className="text-xs text-slate-600 mt-1">NOT NULL violation - required field is missing</p>
              </div>
              <div className="bg-white rounded p-3 border border-slate-200">
                <code className="text-xs text-emerald-700 font-mono">PGRST116</code>
                <p className="text-xs text-slate-600 mt-1">Resource not found - query returned no results</p>
              </div>
              <div className="bg-white rounded p-3 border border-slate-200">
                <code className="text-xs text-emerald-700 font-mono">22P02</code>
                <p className="text-xs text-slate-600 mt-1">Invalid text representation - wrong data format</p>
              </div>
              <div className="bg-white rounded p-3 border border-slate-200">
                <code className="text-xs text-emerald-700 font-mono">Network</code>
                <p className="text-xs text-slate-600 mt-1">Connection error - check internet connectivity</p>
              </div>
            </div>
          </div>
        </div>

        {/* TypeScript Section */}
        <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Code2 className="w-5 h-5 text-indigo-700" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">TypeScript Support</h2>
              <p className="text-slate-600">Type-safe development with full TypeScript support</p>
            </div>
          </div>

          <div className="space-y-6">
            {typescriptExamples.map((example, index) => (
              <motion.div
                key={example.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border border-slate-200 rounded-lg overflow-hidden"
              >
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                  <h3 className="text-base font-semibold text-slate-900 mb-1">{example.title}</h3>
                  <p className="text-sm text-slate-600">{example.description}</p>
                </div>
                <div className="p-4">
                  <div className="relative group">
                    <button
                      onClick={() => handleCopy(example.code, `ts-${index}`)}
                      className="absolute top-2 right-2 p-1.5 bg-slate-700 hover:bg-slate-600 rounded opacity-0 group-hover:opacity-100 transition z-10"
                      aria-label="Copy code"
                    >
                      {copied === `ts-${index}` ? (
                        <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                    <pre className="bg-slate-900 rounded p-3 overflow-x-auto">
                      <code className="text-xs text-slate-300 font-mono block">{example.code}</code>
                    </pre>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <h4 className="text-sm font-semibold text-indigo-900 mb-2">TypeScript Best Practices</h4>
            <ul className="text-xs text-indigo-800 space-y-1">
              <li>• Define interfaces for all your database tables to get full type safety</li>
              <li>• Use generic functions to create reusable type-safe utilities</li>
              <li>• Leverage TypeScript's utility types (Pick, Omit, Partial) for precise type definitions</li>
              <li>• Create custom hooks that are generic and work with any table type</li>
              <li>• Use type guards and discriminated unions for complex data structures</li>
              <li>• Enable strict mode in tsconfig.json for maximum type safety</li>
              <li>• Use the 'as' keyword sparingly - prefer proper type definitions</li>
            </ul>
          </div>
        </div>

        {/* Realtime Section */}
        <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="w-5 h-5 text-orange-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Realtime</h2>
              <p className="text-slate-600">Subscribe to database changes and broadcast messages</p>
            </div>
          </div>

          <div className="space-y-6">
            {realtimeExamples.map((example, index) => (
              <motion.div
                key={example.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border border-slate-200 rounded-lg overflow-hidden"
              >
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                  <h3 className="text-base font-semibold text-slate-900 mb-1">{example.title}</h3>
                  <p className="text-sm text-slate-600">{example.description}</p>
                </div>
                <div className="p-4">
                  <div className="relative group">
                    <button
                      onClick={() => handleCopy(example.code, `realtime-${index}`)}
                      className="absolute top-2 right-2 p-1.5 bg-slate-700 hover:bg-slate-600 rounded opacity-0 group-hover:opacity-100 transition z-10"
                      aria-label="Copy code"
                    >
                      {copied === `realtime-${index}` ? (
                        <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                    <pre className="bg-slate-900 rounded p-3 overflow-x-auto">
                      <code className="text-xs text-slate-300 font-mono block">{example.code}</code>
                    </pre>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <h4 className="text-sm font-semibold text-orange-900 mb-2">Realtime Best Practices</h4>
            <ul className="text-xs text-orange-800 space-y-1">
              <li>• Always unsubscribe from channels when components unmount to prevent memory leaks</li>
              <li>• Use specific filters to receive only relevant changes and reduce bandwidth</li>
              <li>• Handle connection states (SUBSCRIBED, TIMED_OUT, CLOSED, CHANNEL_ERROR)</li>
              <li>• Use presence tracking for collaborative features and online status</li>
              <li>• Broadcast messages work well for chat, notifications, and client-to-client communication</li>
              <li>• The SDK automatically handles reconnection for transient network issues</li>
            </ul>
          </div>
        </div>

        {/* Storage Section */}
        <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <svg className="w-5 h-5 text-cyan-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Storage</h2>
              <p className="text-slate-600">Upload, download, and manage files</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-6 border border-slate-200 mb-6">
            <h3 className="text-base font-semibold text-slate-900 mb-3">File Upload Example</h3>
            <div className="relative group">
              <button
                onClick={() => handleCopy(`// Upload a file from a file input
const fileInput = document.querySelector('input[type="file"]')
const file = fileInput.files[0]

const { data, error } = await client.storage
  .from('avatars')
  .upload('user123.jpg', file, {
    cacheControl: '3600',
    upsert: false
  })

if (error) {
  console.error('Upload failed:', error.message)
} else {
  console.log('File uploaded:', data.path)
}`, 'storage-upload')}
                className="absolute top-2 right-2 p-1.5 bg-slate-700 hover:bg-slate-600 rounded opacity-0 group-hover:opacity-100 transition z-10"
                aria-label="Copy code"
              >
                {copied === 'storage-upload' ? (
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
              <pre className="bg-slate-900 rounded p-3 overflow-x-auto">
                <code className="text-xs text-slate-300 font-mono block">{`// Upload a file from a file input
const fileInput = document.querySelector('input[type="file"]')
const file = fileInput.files[0]

const { data, error } = await client.storage
  .from('avatars')
  .upload('user123.jpg', file, {
    cacheControl: '3600',
    upsert: false
  })

if (error) {
  console.error('Upload failed:', error.message)
} else {
  console.log('File uploaded:', data.path)
}`}</code>
              </pre>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h4 className="text-sm font-semibold text-slate-900 mb-2">Get Public URL</h4>
              <div className="relative group">
                <button
                  onClick={() => handleCopy(`const { data } = client.storage
  .from('avatars')
  .getPublicUrl('user123.jpg')

console.log('Public URL:', data.publicUrl)`, 'storage-url')}
                  className="absolute top-2 right-2 p-1.5 bg-slate-700 hover:bg-slate-600 rounded opacity-0 group-hover:opacity-100 transition z-10"
                >
                  {copied === 'storage-url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                </button>
                <pre className="bg-slate-900 rounded p-3 overflow-x-auto">
                  <code className="text-xs text-slate-300 font-mono block">{`const { data } = client.storage
  .from('avatars')
  .getPublicUrl('user123.jpg')

console.log('Public URL:', data.publicUrl)`}</code>
                </pre>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h4 className="text-sm font-semibold text-slate-900 mb-2">List Files</h4>
              <div className="relative group">
                <button
                  onClick={() => handleCopy(`const { data, error } = await client.storage
  .from('avatars')
  .list('uploads', {
    limit: 100,
    offset: 0,
    sortBy: { column: 'created_at', order: 'asc' }
  })

console.log('Files:', data)`, 'storage-list')}
                  className="absolute top-2 right-2 p-1.5 bg-slate-700 hover:bg-slate-600 rounded opacity-0 group-hover:opacity-100 transition z-10"
                >
                  {copied === 'storage-list' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                </button>
                <pre className="bg-slate-900 rounded p-3 overflow-x-auto">
                  <code className="text-xs text-slate-300 font-mono block">{`const { data, error } = await client.storage
  .from('avatars')
  .list('uploads', {
    limit: 100,
    offset: 0,
    sortBy: { column: 'created_at', order: 'asc' }
  })

console.log('Files:', data)`}</code>
                </pre>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h4 className="text-sm font-semibold text-slate-900 mb-2">Download File</h4>
              <div className="relative group">
                <button
                  onClick={() => handleCopy(`const { data, error } = await client.storage
  .from('avatars')
  .download('user123.jpg')

// Create a blob URL for download
const url = URL.createObjectURL(data)
const a = document.createElement('a')
a.href = url
a.download = 'user123.jpg'
a.click()`, 'storage-download')}
                  className="absolute top-2 right-2 p-1.5 bg-slate-700 hover:bg-slate-600 rounded opacity-0 group-hover:opacity-100 transition z-10"
                >
                  {copied === 'storage-download' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                </button>
                <pre className="bg-slate-900 rounded p-3 overflow-x-auto">
                  <code className="text-xs text-slate-300 font-mono block">{`const { data, error } = await client.storage
  .from('avatars')
  .download('user123.jpg')

// Create blob URL for download
const url = URL.createObjectURL(data)
const a = document.createElement('a')
a.href = url
a.download = 'user123.jpg'
a.click()`}</code>
                </pre>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h4 className="text-sm font-semibold text-slate-900 mb-2">Delete File</h4>
              <div className="relative group">
                <button
                  onClick={() => handleCopy(`const { error } = await client.storage
  .from('avatars')
  .remove(['user123.jpg', 'user456.jpg'])

if (error) {
  console.error('Delete failed:', error.message)
} else {
  console.log('Files deleted successfully')
}`, 'storage-delete')}
                  className="absolute top-2 right-2 p-1.5 bg-slate-700 hover:bg-slate-600 rounded opacity-0 group-hover:opacity-100 transition z-10"
                >
                  {copied === 'storage-delete' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                </button>
                <pre className="bg-slate-900 rounded p-3 overflow-x-auto">
                  <code className="text-xs text-slate-300 font-mono block">{`const { error } = await client.storage
  .from('avatars')
  .remove(['user123.jpg', 'user456.jpg'])

if (error) {
  console.error('Delete failed:', error.message)
} else {
  console.log('Files deleted successfully')
}`}</code>
                </pre>
              </div>
            </div>
          </div>

          <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-200">
            <h4 className="text-sm font-semibold text-cyan-900 mb-2">Storage Best Practices</h4>
            <ul className="text-xs text-cyan-800 space-y-1">
              <li>• Use unique file names or UUIDs to avoid overwrites (unless upsert is intentional)</li>
              <li>• Set appropriate cacheControl headers for file types (images: 3600, assets: 86400)</li>
              <li>• Validate file types and sizes on the client before uploading</li>
              <li>• Use bucket folders to organize files (e.g., 'avatars/user123/profile.jpg')</li>
              <li>• Handle upload errors gracefully and provide feedback to users</li>
            </ul>
          </div>
        </div>

        <div className="space-y-8 mb-12">
          <h2 className="text-xl font-semibold text-slate-900">Additional Features</h2>
          {codeExamples.map((example, index) => (
            <motion.div
              key={example.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-1">{example.title}</h3>
                <p className="text-slate-600">{example.description}</p>
              </div>
              <div className="p-6">
                <div className="relative group">
                  <button
                    onClick={() => handleCopy(example.code, `example-${index}`)}
                    className="absolute top-3 right-3 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg opacity-0 group-hover:opacity-100 transition z-10"
                  >
                    {copied === `example-${index}` ? (
                      <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                  <pre className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                    <code className="text-sm text-slate-300 font-mono">{example.code}</code>
                  </pre>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Resources</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <a
              href="https://github.com/Mkid095/nextmavens-js"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-md transition"
            >
              <Github className="w-5 h-5 text-slate-700" />
              <div>
                <p className="font-medium text-slate-900">GitHub Repository</p>
                <p className="text-sm text-slate-600">View source code</p>
              </div>
            </a>
            <a
              href="https://github.com/Mkid095/nextmavens-js/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-md transition"
            >
              <FileText className="w-5 h-5 text-slate-700" />
              <div>
                <p className="font-medium text-slate-900">Report an Issue</p>
                <p className="text-sm text-slate-600">File bugs and requests</p>
              </div>
            </a>
            <a
              href="https://github.com/Mkid095/nextmavens-js/blob/main/CONTRIBUTING.md"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-md transition"
            >
              <Download className="w-5 h-5 text-slate-700" />
              <div>
                <p className="font-medium text-slate-900">Contributing</p>
                <p className="text-sm text-slate-600">How to contribute</p>
              </div>
            </a>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-between">
          <Link href="/docs/realtime" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" />
            Realtime Docs
          </Link>
          <Link href="/docs/platform-philosophy" className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-800 font-medium">
            Platform Philosophy
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  )
}
