/**
 * Audit Logger - Sanitization Functions
 *
 * US-011: Local sanitization functions for audit logging
 * These prevent secret values from appearing in logs
 */

/**
 * Sensitive keys that should be redacted from audit logs
 */
const SENSITIVE_KEYS = [
  'password', 'token', 'secret', 'apiKey', 'api_key', 'authorization',
  'cookie', 'session', 'jwt', 'private', 'credentials', 'value_encrypted',
  'access_token', 'refresh_token', 'api_key', 'secret_key'
]

/**
 * Sanitize metadata for audit logging
 * Removes sensitive keys and their values
 */
export function sanitizeAuditMetadata(metadata: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!metadata) return {}

  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(metadata)) {
    const lowerKey = key.toLowerCase()
    const isSensitive = SENSITIVE_KEYS.some(sensitive => lowerKey.includes(sensitive.toLowerCase()))

    if (isSensitive) {
      // Skip sensitive fields entirely in audit logs
      continue
    }

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeAuditMetadata(value as Record<string, unknown>)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'object' && item !== null && !Array.isArray(item)
          ? sanitizeAuditMetadata(item as Record<string, unknown>)
          : item
      )
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Redact secret patterns from strings
 */
export function redactSecretPatterns(message: string): string {
  let redacted = message

  // Redact common secret patterns
  const patterns = [
    /(?:password|secret|token|key|api_key|apikey|access[_-]?key|auth[_-]?token|bearer|authorization)[:\s]+([^\s,}]+)/gi,
    /"(?:password|secret|token|key|api[_-]?key|access[_-]?key|value)":\s*"([^"]+)"/gi,
  ]

  for (const pattern of patterns) {
    redacted = redacted.replace(pattern, (match, group1) => {
      if (group1) {
        return match.replace(group1, '[REDACTED]')
      }
      return '[REDACTED]'
    })
  }

  return redacted
}
