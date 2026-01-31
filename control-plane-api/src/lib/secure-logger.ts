/**
 * Secure Logger for Secrets
 * PRD: US-011 from prd-secrets-versioning.json
 *
 * Prevents secret values from being logged by:
 * - Redacting secret patterns from log messages
 * - Ensuring secret values never in logs
 * - Ensuring secret values never in error messages
 * - Ensuring secret values never in audit logs (only refs)
 *
 * IMPORTANT: Never log secret values directly. Always use secret references (ID, name).
 */

/**
 * Patterns that might indicate secret values in logs
 * These are patterns that should be redacted from logs
 */
const SECRET_PATTERNS = [
  // Common secret names followed by values
  /(?:password|secret|token|key|api_key|apikey|access[_-]?key|secret[_-]?key|auth[_-]?token|bearer|authorization)[:\s]+([^\s,}]+)/gi,
  // JSON-like structures with secret values
  /"(?:password|secret|token|key|api[_-]?key|access[_-]?key|value)":\s*"([^"]+)"/gi,
  // Base64 strings that might be secrets (16+ chars)
  /(?:[A-Za-z0-9+\/]{4}){4,}(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?/g,
  // UUID-like patterns (might be secret IDs, but redact to be safe)
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
  // Long alphanumeric strings (might be tokens/keys)
  /\b[A-Za-z0-9]{20,}\b/g,
]

/**
 * Redact potential secret values from a message
 *
 * @param message - The message to redact
 * @returns The redacted message
 */
export function redactSecrets(message: string): string {
  let redacted = message

  // Apply all secret patterns
  for (const pattern of SECRET_PATTERNS) {
    redacted = redacted.replace(pattern, (match, group1) => {
      // If we captured a group (secret value), replace it
      if (group1) {
        return match.replace(group1, '[REDACTED]')
      }
      // Otherwise, replace the entire match
      return '[REDACTED]'
    })
  }

  return redacted
}

/**
 * Sanitize an object for logging by redacting secret values
 *
 * @param obj - The object to sanitize
 * @returns The sanitized object
 */
export function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase()

    // Check if this key might contain a secret value
    const isSecretKey =
      lowerKey.includes('password') ||
      lowerKey.includes('secret') ||
      lowerKey.includes('token') ||
      lowerKey.includes('key') ||
      lowerKey.includes('api') ||
      lowerKey.includes('auth') ||
      lowerKey.includes('value') && (
        lowerKey.includes('encrypted') ||
        lowerKey.includes('secret')
      )

    if (isSecretKey && typeof value === 'string') {
      // Redact the value
      sanitized[key] = '[REDACTED]'
    } else if (typeof value === 'object' && value !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeObject(value as Record<string, unknown>)
    } else if (Array.isArray(value)) {
      // Sanitize arrays
      sanitized[key] = value.map(item =>
        typeof item === 'object' && item !== null
          ? sanitizeObject(item as Record<string, unknown>)
          : item
      )
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Secure console.log for secrets-related operations
 * Redacts secret patterns before logging
 *
 * @param message - The message to log
 * @param args - Additional arguments to log
 */
export function secureLog(message: string, ...args: unknown[]): void {
  const redactedMessage = redactSecrets(message)

  const redactedArgs = args.map(arg => {
    if (typeof arg === 'string') {
      return redactSecrets(arg)
    } else if (typeof arg === 'object' && arg !== null) {
      return sanitizeObject(arg as Record<string, unknown>)
    }
    return arg
  })

  console.log(`[Secrets API] ${redactedMessage}`, ...redactedArgs)
}

/**
 * Secure console.error for secrets-related operations
 * Redacts secret patterns before logging errors
 *
 * @param message - The error message to log
 * @param args - Additional arguments to log
 */
export function secureError(message: string, ...args: unknown[]): void {
  const redactedMessage = redactSecrets(message)

  const redactedArgs = args.map(arg => {
    if (typeof arg === 'string') {
      return redactSecrets(arg)
    } else if (typeof arg === 'object' && arg !== null) {
      return sanitizeObject(arg as Record<string, unknown>)
    }
    return arg
  })

  console.error(`[Secrets API] ${redactedMessage}`, ...redactedArgs)
}

/**
 * Create a safe audit log entry for secret operations
 * Ensures only secret references (ID, name) are logged, never values
 *
 * @param entry - The audit log entry
 * @returns A safe audit log entry with secret values redacted
 */
export function createSafeAuditEntry<T extends Record<string, unknown>>(
  entry: T
): T {
  const safeEntry = { ...entry }

  // Remove any fields that might contain secret values
  const dangerousKeys = [
    'value',
    'value_encrypted',
    'password',
    'secret',
    'token',
    'apiKey',
    'api_key',
    'accessToken',
    'access_token',
    'newValue',
    'oldValue',
  ]

  for (const key of dangerousKeys) {
    if (key in safeEntry) {
      delete (safeEntry as Record<string, unknown>)[key]
    }
  }

  return safeEntry
}

/**
 * Safe error response for secrets operations
 * Ensures secret values never appear in error messages
 *
 * @param code - Error code
 * @param message - Error message (will be redacted)
 * @param status - HTTP status code
 * @returns NextResponse with safe error
 */
export function safeErrorResponse(
  code: string,
  message: string,
  status: number
): Response {
  // Redact any potential secret values from the error message
  const safeMessage = redactSecrets(message)

  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code,
        message: safeMessage,
      },
    }),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}

/**
 * Validate that an object doesn't contain secret values in dangerous fields
 * Use this before logging or returning data
 *
 * @param obj - The object to validate
 * @returns true if safe, false if contains secrets in dangerous places
 */
export function validateNoSecretValues(obj: Record<string, unknown>): boolean {
  const dangerousKeys = [
    'value',
    'password',
    'secret',
    'token',
    'apiKey',
    'api_key',
    'accessToken',
    'access_token',
  ]

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase()

    // Check if this is a dangerous key with a string value
    if (
      dangerousKeys.some(dangerous => lowerKey.includes(dangerous.toLowerCase())) &&
      typeof value === 'string' &&
      value !== '[REDACTED]' &&
      value !== '' &&
      value.length > 0
    ) {
      // This looks like a secret value in the output!
      return false
    }
  }

  return true
}
